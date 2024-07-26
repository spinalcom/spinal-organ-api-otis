/*
 * Copyright 2021 SpinalCom - www.spinalcom.com
 *
 * This file is part of SpinalCore.
 *
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 *
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 *
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */

import moment = require('moment');
import {
  SpinalContext,
  SpinalGraph,
  SpinalGraphService,
  SpinalNode,
  SpinalNodeRef,
  SPINAL_RELATION_PTR_LST_TYPE,
} from 'spinal-env-viewer-graph-service';
import { spinalServiceTicket } from 'spinal-service-ticket';
import {
  SPINAL_TICKET_SERVICE_STEP_RELATION_NAME,
  SPINAL_TICKET_SERVICE_STEP_TYPE,
  SPINAL_TICKET_SERVICE_TICKET_RELATION_NAME,
  SPINAL_TICKET_SERVICE_PROCESS_RELATION_NAME,
  SPINAL_TICKET_SERVICE_TICKET_TYPE,
} from '../../../constants';
import type OrganConfigModel from '../../../model/OrganConfigModel';
import {
  IAvailabilityResponse,
  IMaintenanceResponse,
  ICustomerCallBackResponse,
  IRepairResponse,
  IPerformanceResponse,
  IStatusResponse,
  IElevatorPerformance,
  getAvailabilityData,
  getMaintenanceData,
  getRepairData,
  getCustomerCallBackData,
  getPerformanceData,
  getStatusData,
} from '../../../services/client/DIConsulte';
import { attributeService } from 'spinal-env-viewer-plugin-documentation-service';
import { NetworkService } from 'spinal-model-bmsnetwork';
import {
  InputDataDevice,
  InputDataEndpoint,
  InputDataEndpointGroup,
  InputDataEndpointDataType,
  InputDataEndpointType,
} from '../../../model/InputData/InputDataModel/InputDataModel';
import { SpinalServiceTimeseries } from 'spinal-model-timeseries';

/**
 * Main purpose of this class is to pull tickets from client.
 *
 * @export
 * @class SyncRunPull
 */
export class SyncRunPull {
  graph: SpinalGraph<any>;
  config: OrganConfigModel;
  interval: number;
  running: boolean;
  foundElevators: string[];
  nwService: NetworkService;
  timeseriesService: SpinalServiceTimeseries;
  mappingElevators: Map<string, string>;

  constructor(
    graph: SpinalGraph<any>,
    config: OrganConfigModel,
    nwService: NetworkService
  ) {
    this.graph = graph;
    this.config = config;
    this.running = false;
    this.nwService = nwService;
    this.timeseriesService = new SpinalServiceTimeseries();
    this.mappingElevators = new Map<string, string>();
  }

  async getContext(): Promise<SpinalNode<any>> {
    const contexts = await this.graph.getChildren();
    for (const context of contexts) {
      if (context.info.id.get() === this.config.ticketContextId.get()) {
        // @ts-ignore
        SpinalGraphService._addNode(context);
        return context;
      }
    }
    throw new Error('Context Not found');
  }

  async mapElevatorsToId(): Promise<void> {
    const contexts = await this.graph.getChildren();
    const context = contexts.find((context) => {
      // @ts-ignore
      SpinalGraphService._addNode(context);
      return context.info.name.get() === process.env.EQUIPMENT_CONTEXT_NAME;
    });
    if (!context)
      throw new Error(
        `Context ${process.env.EQUIPMENT_CONTEXT_NAME} not found`
      );
    const categories = await context.getChildren();
    const category = categories.find(
      (category) => {
        // @ts-ignore
        SpinalGraphService._addNode(category);
        return category.info.name.get() === process.env.EQUIPMENT_CATEGORY_NAME
  });
    if (!category)
      throw new Error(
        `Category ${process.env.ELEVATOR_CATEGORY_NAME} not found`
      );
    const groups = await category.getChildren();
    const group = groups.find(
      (group) => {
        // @ts-ignore
        SpinalGraphService._addNode(group);
        return group.info.name.get() === process.env.EQUIPMENT_GROUP_NAME
    });
    if (!group)
      throw new Error(`Group ${process.env.EQUIPMENT_GROUP_NAME} not found`);

    const equipments = await group.getChildren();
    for (const equipment of equipments) {
      // @ts-ignore
      SpinalGraphService._addNode(equipment);
      const equipment_name = equipment.info.name.get().split('_')[0];
      const elevator_names = equipment_name.split('-');
      for (const elevator_name of elevator_names) {
        this.mappingElevators.set(elevator_name, equipment.info.id.get());
      }
    }
  }

  /**
   * @async
   *
   * @return {*}  {Promise<void>}
   * @memberof SyncRunPull
   */
  async pullAndUpdateTickets(): Promise<void> {
    const availabilityData = await getAvailabilityData();
    const maintenanceData = await getMaintenanceData();
    const repairData = await getRepairData();
    const customerCallBackData = await getCustomerCallBackData();
    const context = await this.getContext();
    const processes = await spinalServiceTicket.getAllProcess(
      context.info.id.get()
    );
    const availabilityProcess = processes.find(
      (proc) => proc.name.get() === process.env.AVAILABILITY_PROCESS_NAME
    );
    const maintenanceProcess = processes.find(
      (proc) => proc.name.get() === process.env.MAINTENANCE_PROCESS_NAME
    );
    const repairProcess = processes.find(
      (proc) => proc.name.get() === process.env.REPAIR_PROCESS_NAME
    );
    const customerCallBackProcess = processes.find(
      (proc) => proc.name.get() === process.env.CUSTOMER_CALLBACK_PROCESS_NAME
    );

    for (const ticket of availabilityData) {
      if (!this.foundElevators.includes(ticket.unit_id)) {
        this.foundElevators.push(ticket.unit_id);
      }
      await this.updateAvailabilityTicket(
        ticket,
        context,
        availabilityProcess.id.get()
      );
    }
    for (const ticket of maintenanceData) {
      if (!this.foundElevators.includes(ticket.unit_id)) {
        this.foundElevators.push(ticket.unit_id);
      }
      await this.updateMaintenanceTicket(
        ticket,
        context,
        maintenanceProcess.id.get()
      );
    }
    for (const ticket of repairData) {
      if (!this.foundElevators.includes(ticket.unit_id)) {
        this.foundElevators.push(ticket.unit_id);
      }
      await this.updateRepairTicket(ticket, context, repairProcess.id.get());
    }
    for (const ticket of customerCallBackData) {
      if (!this.foundElevators.includes(ticket.unit_id)) {
        this.foundElevators.push(ticket.unit_id);
      }
      await this.updateCustomerTicket(
        ticket,
        context,
        customerCallBackProcess.id.get()
      );
    }
  }

  async ticketsAreEqual(
    clientTicket:
      | IAvailabilityResponse
      | ICustomerCallBackResponse
      | IMaintenanceResponse
      | IRepairResponse,
    spinalTicket: SpinalNode<any>
  ): Promise<boolean> {
    const attributes = await attributeService.getAttributesByCategory(
      spinalTicket,
      'OTIS'
    );
    //console.log('All attributes to test : ',attributes);
    for (const attr of attributes) {
      if (clientTicket[attr.label.get()] == undefined) continue;
      if (attr.value.get() != clientTicket[attr.label.get()].trim()) {
        return false;
      }
    }
    return true;
  }

  async updateCustomerTicket(
    clientTicket: ICustomerCallBackResponse,
    context: SpinalNode<any>,
    processId: string
  ): Promise<void> {
    // 1-Check if ticket already exist
    const steps: SpinalNodeRef[] =
      await spinalServiceTicket.getStepsFromProcess(
        processId,
        context.info.id.get()
      );
    let tickets: SpinalNodeRef[] = [];

    for (const step of steps) {
      const stepTickets = await spinalServiceTicket.getTicketsFromStep(
        step.id.get()
      );
      tickets.push(...stepTickets);
    }

    tickets = tickets.filter((ticket) => ticket.name.get() == clientTicket.unit_id);

    for (const spinalTicket of tickets) {
      const spinalTicketNode = SpinalGraphService.getRealNode(
        spinalTicket.id.get()
      );
      if (await this.ticketsAreEqual(clientTicket, spinalTicketNode)) {
        console.log(`${clientTicket.unit_id} Customer ticket already exist, serverId: ${spinalTicketNode._server_id}`);
        return;
      }
    }
    console.log(`${clientTicket.unit_id} Customer ticket does not exist, creating ...`);
    // 2-Create ticket
    const ticketInfo = {
      name: `${clientTicket.unit_id}`,
    };
    const ticketId = await spinalServiceTicket.addTicket(
      ticketInfo,
      processId,
      context.info.id.get(),
      this.mappingElevators.get(clientTicket.unit_id)
    );
    if (typeof ticketId !== 'string') return console.error(ticketId);
    if (clientTicket.resolution.trim() != '')
      await spinalServiceTicket.moveTicketToNextStep(
        context.info.id.get(),
        processId,
        ticketId
      );
    const ticketNode = SpinalGraphService.getRealNode(ticketId);
    const category = await attributeService.addCategoryAttribute(
      ticketNode,
      'OTIS'
    );
    for (const key of Object.keys(clientTicket)) {
      if (key == 'caller_name' || key == 'mechanic_name') continue;
      if (clientTicket[key] == undefined || clientTicket[key] == ' ')
        clientTicket[key] = '';

      attributeService.addAttributeByCategory(
        ticketNode,
        category,
        key,
        clientTicket[key],
        'string'
      );
    }
  }

  async updateMaintenanceTicket(
    clientTicket: IMaintenanceResponse,
    context: SpinalNode<any>,
    processId: string
  ): Promise<void> {
    // 1-Check if ticket already exist
    const steps: SpinalNodeRef[] =
      await spinalServiceTicket.getStepsFromProcess(
        processId,
        context.info.id.get()
      );
    let  tickets: SpinalNodeRef[] = [];
    for (const step of steps) {
      const stepTickets = await spinalServiceTicket.getTicketsFromStep(
        step.id.get()
      );
      tickets.push(...stepTickets);
    }

    tickets = tickets.filter((ticket) => ticket.name.get() == clientTicket.unit_id);

    for (const spinalTicket of tickets) {
      const spinalTicketNode = SpinalGraphService.getRealNode(
        spinalTicket.id.get()
      );
      if (await this.ticketsAreEqual(clientTicket, spinalTicketNode)) {
        console.log(`${clientTicket.unit_id} Maintenance ticket already exist`)
        return;
      }
    }
    console.log(`${clientTicket.unit_id} Maintenance ticket does not exist, creating ticket ...`);
    // 2-Create ticket
    const ticketInfo = {
      name: `${clientTicket.unit_id}`,
    };
    const ticketId = await spinalServiceTicket.addTicket(
      ticketInfo,
      processId,
      context.info.id.get(),
      this.mappingElevators.get(clientTicket.unit_id)
    );
    if (typeof ticketId !== 'string') return console.error(ticketId);

    await spinalServiceTicket.moveTicketToNextStep(
      context.info.id.get(),
      processId,
      ticketId
    );
    const ticketNode = SpinalGraphService.getRealNode(ticketId);
    const category = await attributeService.addCategoryAttribute(
      ticketNode,
      'OTIS'
    );
    for (const key of Object.keys(clientTicket)) {
      if (key == 'caller_name' || key == 'mechanic_name') continue;
      if (clientTicket[key] == undefined || clientTicket[key] == ' ')
        clientTicket[key] = '';
      attributeService.addAttributeByCategory(
        ticketNode,
        category,
        key,
        clientTicket[key],
        'string'
      );
    }
  }

  async updateRepairTicket(
    clientTicket: IRepairResponse,
    context: SpinalNode<any>,
    processId: string
  ): Promise<void> {
    // 1-Check if ticket already exist
    const steps: SpinalNodeRef[] =
      await spinalServiceTicket.getStepsFromProcess(
        processId,
        context.info.id.get()
      );
    let  tickets: SpinalNodeRef[] = [];
    for (const step of steps) {
      const stepTickets = await spinalServiceTicket.getTicketsFromStep(
        step.id.get()
      );
      tickets.push(...stepTickets);
    }

    tickets = tickets.filter((ticket) => ticket.name.get() == clientTicket.unit_id);

    for (const spinalTicket of tickets) {
      const spinalTicketNode = SpinalGraphService.getRealNode(
        spinalTicket.id.get()
      );
      if (
        (await this.ticketsAreEqual(clientTicket, spinalTicketNode)) ||
        clientTicket.Message.trim() ==
          'This unit was never repaired in last 12 months'
      ) {
        console.log(
          `${clientTicket.unit_id} Repair ticket already exist or unit was never repaired in last 12 months`
        );
        return;
      }
    }
    console.log(`${clientTicket.unit_id} Repair ticket does not exist, creating ...`);
    // 2-Create ticket
    const ticketInfo = {
      name: `${clientTicket.unit_id}`,
    };
    const ticketId = await spinalServiceTicket.addTicket(
      ticketInfo,
      processId,
      context.info.id.get(),
      this.mappingElevators.get(clientTicket.unit_id)
    );
    if (typeof ticketId !== 'string') return console.error(ticketId);

    await spinalServiceTicket.moveTicketToNextStep(
      context.info.id.get(),
      processId,
      ticketId
    );
    const ticketNode = SpinalGraphService.getRealNode(ticketId);
    const category = await attributeService.addCategoryAttribute(
      ticketNode,
      'OTIS'
    );
    for (const key of Object.keys(clientTicket)) {
      if (key == 'caller_name' || key == 'mechanic_name') continue;
      if (clientTicket[key] == undefined || clientTicket[key] == ' ')
        clientTicket[key] = '';
      attributeService.addAttributeByCategory(
        ticketNode,
        category,
        key,
        clientTicket[key],
        'string'
      );
    }
  }

  async updateAvailabilityTicket(
    clientTicket: IAvailabilityResponse,
    context: SpinalNode<any>,
    processId: string
  ): Promise<void> {
    // 1-Check if ticket already exist

    const steps: SpinalNodeRef[] =
      await spinalServiceTicket.getStepsFromProcess(
        processId,
        context.info.id.get()
      );
    let  tickets: SpinalNodeRef[] = [];
    for (const step of steps) {
      const stepTickets = await spinalServiceTicket.getTicketsFromStep(
        step.id.get()
      );
      tickets.push(...stepTickets);
    }
    tickets = tickets.filter((ticket) => ticket.name.get() == clientTicket.unit_id);
    for (const spinalTicket of tickets) {
      const spinalTicketNode = SpinalGraphService.getRealNode(
        spinalTicket.id.get()
      );
      if (
        (await this.ticketsAreEqual(clientTicket, spinalTicketNode)) ||
        clientTicket.Message.trim() ==
          'This unit was never shutdown in last 12 months'
      ) {
        console.log(
          `${clientTicket.unit_id} Availability ticket already exist or unit was never shutdown in last 12 months`
        );
        return;
      }
    }
    console.log(`${clientTicket.unit_id} Availability ticket does not exist, creating ...`);
    // 2-Create ticket
    const ticketInfo = {
      name: `${clientTicket.unit_id}`,
    };
    console.log(
      ` node id to link to : ${this.mappingElevators.get(clientTicket.unit_id)}`
    );
    const ticketId = await spinalServiceTicket.addTicket(
      ticketInfo,
      processId,
      context.info.id.get(),
      this.mappingElevators.get(clientTicket.unit_id)
    );
    if (typeof ticketId !== 'string') return console.error(ticketId);
    await spinalServiceTicket.moveTicketToNextStep(
      context.info.id.get(),
      processId,
      ticketId
    );
    const ticketNode = SpinalGraphService.getRealNode(ticketId);
    const category = await attributeService.addCategoryAttribute(
      ticketNode,
      'OTIS'
    );
    for (const key of Object.keys(clientTicket)) {
      if (key == 'caller_name' || key == 'mechanic_name') continue;
      if (clientTicket[key] == undefined || clientTicket[key] == ' ')
        clientTicket[key] = '';
      attributeService.addAttributeByCategory(
        ticketNode,
        category,
        key,
        clientTicket[key],
        'string'
      );
    }
  }

  async getNetworkContext(): Promise<SpinalNode<any>> {
    const contexts = await this.graph.getChildren();
    for (const context of contexts) {
      if (context.info.name.get() === 'Network OTIS') {
        // @ts-ignore
        SpinalGraphService._addNode(context);
        return context;
      }
    }
    throw new Error('Network Context Not found');
  }

  private waitFct(nb: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(
        () => {
          resolve();
        },
        nb >= 0 ? nb : 0
      );
    });
  }



  dateToNumber(dateString: string | Date) {
    const dateObj = new Date(dateString);
    return dateObj.getTime();
  }

  async getRunCountsEndpoint(deviceNode: SpinalNode<any>) {
    const deviceEndpoints = await deviceNode.getChildren('hasBmsEndpoint');
    const runCountsEndpoint = deviceEndpoints.find(
      (endpoint) => endpoint.info.name.get() === `${deviceNode.info.name.get()}_Run counts`
    );
    SpinalGraphService._addNode(runCountsEndpoint);
    return runCountsEndpoint;
  }

  async getUnitStateEndpoint(deviceNode: SpinalNode<any>) {
    const deviceEndpoints = await deviceNode.getChildren('hasBmsEndpoint');
    const unitStateEndpoint = deviceEndpoints.find(
      (endpoint) => endpoint.info.name.get() === `${deviceNode.info.name.get()}_Unit state`
    );
    SpinalGraphService._addNode(unitStateEndpoint);
    return unitStateEndpoint;
  }
  
  async getUptimeEndpoint(deviceNode: SpinalNode<any>) {
    const deviceEndpoints = await deviceNode.getChildren('hasBmsEndpoint');
    const uptimeEndpoint = deviceEndpoints.find(
      (endpoint) => endpoint.info.name.get() === `${deviceNode.info.name.get()}_Uptime 30 days`
    );

    SpinalGraphService._addNode(uptimeEndpoint);
    return uptimeEndpoint;
  }

  async getDoorCyclesEndpoint(deviceNode: SpinalNode<any>) {
    const deviceEndpoints = await deviceNode.getChildren('hasBmsEndpoint');
    const doorCyclesEndpoint = deviceEndpoints.find(
      (endpoint) => endpoint.info.name.get() === `${deviceNode.info.name.get()}_Door cycles`
    );
    SpinalGraphService._addNode(doorCyclesEndpoint);
    return doorCyclesEndpoint;
  }

  async getFloorPositionEndpoint(deviceNode: SpinalNode<any>) {
    const deviceEndpoints = await deviceNode.getChildren('hasBmsEndpoint');
    const floorPositionEndpoint = deviceEndpoints.find(
      (endpoint) => endpoint.info.name.get() === `${deviceNode.info.name.get()}_Floor position`
    );
    SpinalGraphService._addNode(floorPositionEndpoint);
    return floorPositionEndpoint;
  }

  async getFrontDoorStatusEndpoint(deviceNode: SpinalNode<any>) {
    const deviceEndpoints = await deviceNode.getChildren('hasBmsEndpoint');
    const frontDoorStatusEndpoint = deviceEndpoints.find(
      (endpoint) => endpoint.info.name.get() === `${deviceNode.info.name.get()}_Front door status`
    );
    SpinalGraphService._addNode(frontDoorStatusEndpoint);
    return frontDoorStatusEndpoint;
  }

  async getMovementInfoEndpoint(deviceNode: SpinalNode<any>) {
    const deviceEndpoints = await deviceNode.getChildren('hasBmsEndpoint');
    const movementInfoEndpoint = deviceEndpoints.find(
      (endpoint) => endpoint.info.name.get() === `${deviceNode.info.name.get()}_Movement`
    );
    SpinalGraphService._addNode(movementInfoEndpoint);
    return movementInfoEndpoint;
  }

  async getRearDoorStatusEndpoint(deviceNode: SpinalNode<any>) {
    const deviceEndpoints = await deviceNode.getChildren('hasBmsEndpoint');
    const rearDoorStatusEndpoint = deviceEndpoints.find(
      (endpoint) => endpoint.info.name.get() === `${deviceNode.info.name.get()}_Rear door status`
    );
    SpinalGraphService._addNode(rearDoorStatusEndpoint);
    return rearDoorStatusEndpoint;
  }

  async updatePerformanceEndpoints() {
    const networkContext = await this.getNetworkContext();
    for (const elevator of this.foundElevators) {
      const devices = await networkContext.findInContext(
        networkContext,
        (node) => node.info.name.get() === elevator
      );
      if (devices.length == 0) continue;
      const uptimeEndpoint = await this.getUptimeEndpoint(devices[0]);
      const runCountsEndpoint = await this.getRunCountsEndpoint(devices[0]);
      const doorCyclesEndpoint = await this.getDoorCyclesEndpoint(devices[0]);
      const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
      const endDate = moment().format('YYYY-MM-DD');
      try {
        const performanceData = await getPerformanceData(
          devices[0].info.name.get(),
          startDate,
          endDate
        );

        await this.nwService.setEndpointValue(
          uptimeEndpoint.info.id.get(),
          performanceData.uptime_30days
        );
        if(!performanceData.performance || performanceData.performance.length == 0) continue;
        let lastDate = 0;
        let lastPerformance = null;
        for (const performance of performanceData.performance) {
          const runCountValue = parseInt(performance.run_counts);
          const doorCyclesValue = parseInt(performance.door_cycles);
          const newDate = this.dateToNumber(performance.date);
          if ( newDate >lastDate){
            lastDate = newDate;
            lastPerformance = performance;
          }
          await this.timeseriesService.insertFromEndpoint(
            runCountsEndpoint.info.id.get(),
            runCountValue,
            newDate
          );
          await this.timeseriesService.insertFromEndpoint(
            doorCyclesEndpoint.info.id.get(),
            doorCyclesValue,
            newDate
          );
        }

        
        await this.nwService.setEndpointValue(
          runCountsEndpoint.info.id.get(),
          parseInt(lastPerformance.run_counts),
          lastDate
        );
        await this.nwService.setEndpointValue(
          doorCyclesEndpoint.info.id.get(),
          parseInt(lastPerformance.door_cycles),
          lastDate
        );

      } catch (e) {
        console.log(e);
      }
    }
  }

  async updateStatusEndpoints() {
    const networkContext = await this.getNetworkContext();
    for (const elevator of this.foundElevators) {
      const devices = await networkContext.findInContext(
        networkContext,
        (node) => node.info.name.get() === elevator
      );
      if (devices.length == 0) continue;

      const unitStateEndpoint = await this.getUnitStateEndpoint(devices[0]);
      const floorPositionEndpoint = await this.getFloorPositionEndpoint(
        devices[0]
      );
      const movementInfoEndpoint = await this.getMovementInfoEndpoint(
        devices[0]
      );
      const frontDoorStatusEndpoint = await this.getFrontDoorStatusEndpoint(
        devices[0]
      );
      const rearDoorStatusEndpoint = await this.getRearDoorStatusEndpoint(
        devices[0]
      );

      try {
        const statusData = await getStatusData(devices[0].info.name.get());

        await this.nwService.setEndpointValue(
          unitStateEndpoint.info.id.get(),
          statusData.unit_state
        );
        await this.nwService.setEndpointValue(
          floorPositionEndpoint.info.id.get(),
          statusData.floor
        );
        await this.nwService.setEndpointValue(
          movementInfoEndpoint.info.id.get(),
          statusData.moving_direction
        );
        await this.nwService.setEndpointValue(
          frontDoorStatusEndpoint.info.id.get(),
          statusData.front_door_status
        );
        await this.nwService.setEndpointValue(
          rearDoorStatusEndpoint.info.id.get(),
          statusData.rear_door_status
        );
      } catch (e) {
        console.log(e);
      }
    }
  }

  async createDevicesIfNotExist() {
    const networkContext = await this.getNetworkContext();

    for (const elevator of this.foundElevators) {
      const devices = await networkContext.findInContext(
        networkContext,
        (node) => node.info.name.get() === elevator
      );
      if (devices.length > 0) {
        console.log('Device already exists, not creating ', elevator);
        continue;
      }

      const startDate = moment().subtract(120, 'days').format('YYYY-MM-DD');
      const endDate = moment().format('YYYY-MM-DD');

      try {
        const performanceData = await getPerformanceData(
          elevator,
          startDate,
          endDate
        );

        const statusData = await getStatusData(elevator);

        const device = new InputDataDevice(elevator, 'device');

        const uptime_30daysEndpoint = new InputDataEndpoint(
          `${elevator}_Uptime 30 days`,
          performanceData.uptime_30days,
          '%',
          InputDataEndpointDataType.Real,
          InputDataEndpointType.Other
        );
        device.children.push(uptime_30daysEndpoint);

        const elevatorPerformance = performanceData.performance;

        const runCountValue = parseInt(
          elevatorPerformance[elevatorPerformance.length - 1].run_counts
        );
        const runCountsEndpoint = new InputDataEndpoint(
          `${elevator}_Run counts`,
          runCountValue,
          '',
          InputDataEndpointDataType.Integer,
          InputDataEndpointType.Other
        );

        const doorCylcesValue = parseInt(
          elevatorPerformance[elevatorPerformance.length - 1].door_cycles
        );
        const doorCyclesEndpoint = new InputDataEndpoint(
          `${elevator}_Door cycles`,
          doorCylcesValue,
          '',
          InputDataEndpointDataType.Integer,
          InputDataEndpointType.Other
        );
        device.children.push(runCountsEndpoint);
        device.children.push(doorCyclesEndpoint);

        const unitStateEndpoint = new InputDataEndpoint(
          `${elevator}_Unit state`,
          statusData.unit_state,
          '',
          InputDataEndpointDataType.String,
          InputDataEndpointType.Other
        );

        const floorPositionEndpoint = new InputDataEndpoint(
          `${elevator}_Floor position`,
          statusData.floor,
          '',
          InputDataEndpointDataType.String,
          InputDataEndpointType.Other
        );

        const movementInfoEndpoint = new InputDataEndpoint(
          `${elevator}_Movement`,
          statusData.moving_direction,
          '',
          InputDataEndpointDataType.String,
          InputDataEndpointType.Other
        );

        const frontDoorStatusEndpoint = new InputDataEndpoint(
          `${elevator}_Front door status`,
          statusData.front_door_status,
          '',
          InputDataEndpointDataType.String,
          InputDataEndpointType.Other
        );

        const rearDoorStatusEndpoint = new InputDataEndpoint(
          `${elevator}_Rear door status`,
          statusData.rear_door_status,
          '',
          InputDataEndpointDataType.String,
          InputDataEndpointType.Other
        );
        device.children.push(unitStateEndpoint);
        device.children.push(floorPositionEndpoint);
        device.children.push(movementInfoEndpoint);
        device.children.push(frontDoorStatusEndpoint);
        device.children.push(rearDoorStatusEndpoint);

        console.log('Creating device');
        await this.nwService.updateData(device, this.dateToNumber(endDate));
        await this.initData(networkContext, elevator, elevatorPerformance);
      } catch (e) {}
    }
  }

  async initData(
    networkContext: SpinalNode<any>,
    deviceName: string,
    performanceData: IElevatorPerformance[]
  ) {
    const devices = await networkContext.findInContext(
      networkContext,
      (node) => node.info.name.get() === deviceName
    );
    const device = devices[0];
    const runCountsEndpoint = await this.getRunCountsEndpoint(device);
    const doorCyclesEndpoint = await this.getDoorCyclesEndpoint(device);

    await attributeService.updateAttribute(
      runCountsEndpoint,
      'default',
      'timeSeries maxDay',
      { value: '120' }
    );
    await attributeService.updateAttribute(
      doorCyclesEndpoint,
      'default',
      'timeSeries maxDay',
      { value: '120' }
    );

    for (const data of performanceData) {
      const newDate = this.dateToNumber(data.date);
      const runCountValue = parseInt(data.run_counts);
      const doorCyclesValue = parseInt(data.door_cycles);
      await this.timeseriesService.insertFromEndpoint(
        runCountsEndpoint.info.id.get(),
        runCountValue,
        newDate
      );
      await this.timeseriesService.insertFromEndpoint(
        doorCyclesEndpoint.info.id.get(),
        doorCyclesValue,
        newDate
      );
    }
  }

  async init(): Promise<void> {
    console.log('Initiating SyncRunPull');
    await this.mapElevatorsToId();
    console.log(this.mappingElevators);
    this.foundElevators = [];
    try {
      await this.pullAndUpdateTickets();
      console.log('Created and updated elevator tickets');
      await this.createDevicesIfNotExist();
      console.log('Created and initialized elevator devices');
      this.config.lastSync.set(Date.now());
    } catch (e) {
      console.error(e);
    }
  }

  async run(): Promise<void> {
    this.running = true;

    // Initialize the timers for each task
    this.startTicketUpdateTimer();
    this.startPerformanceEndpointUpdateTimer();
    this.startStatusEndpointUpdateTimer();
  }

  startTicketUpdateTimer() {
    const ticketUpdateInterval = parseInt(process.env.TICKET_UPDATE_INTERVAL);
    const updateTickets = async () => {
      if (!this.running) return;
      try {
        console.log('Pulling tickets...');
        await this.pullAndUpdateTickets();
        console.log('done.');
      } catch (e) {
        console.error(e);
      } finally {
        setTimeout(updateTickets, ticketUpdateInterval);
      }
    };
    setTimeout(updateTickets, ticketUpdateInterval);
  }

  startPerformanceEndpointUpdateTimer() {
    const performanceUpdateInterval = parseInt(
      process.env.PERFORMANCE_UPDATE_INTERVAL
    );
    const updatePerformance = async () => {
      if (!this.running) return;
      try {
        console.log('Updating performance endpoints...');
        await this.updatePerformanceEndpoints();
        console.log('done.');
      } catch (e) {
        console.error(e);
      } finally {
        setTimeout(updatePerformance, performanceUpdateInterval);
      }
    };
    setTimeout(updatePerformance, performanceUpdateInterval);
  }

  startStatusEndpointUpdateTimer() {
    const statusUpdateInterval = parseInt(process.env.STATUS_UPDATE_INTERVAL);
    const updateStatus = async () => {
      if (!this.running) return;
      try {
        console.log('Updating status endpoints...');
        await this.updateStatusEndpoints();
        console.log('done.');
      } catch (e) {
        console.error(e);
      } finally {
        setTimeout(updateStatus, statusUpdateInterval);
      }
    };
    setTimeout(updateStatus, statusUpdateInterval);
  }

  stop(): void {
    this.running = false;
  }
}
export default SyncRunPull;
