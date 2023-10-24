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
  IElevatorPerformance,
  getAvailabilityData,
  getMaintenanceData,
  getRepairData,
  getCustomerCallBackData,
  getPerformanceData,
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
  }

  async getContextTicket() {
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
      //await this.updateProcessTicket(ticket,context,process.env.AVAILABILITY_PROCESS_NAME)
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
      await this.updateRepairTicket(
        ticket,
        context,
        repairProcess.id.get()
      );
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
    const tickets: SpinalNodeRef[] = [];

    for (const step of steps) {
      const stepTickets = await spinalServiceTicket.getTicketsFromStep(
        step.id.get()
      );
      tickets.push(...stepTickets);
    }

    for (const spinalTicket of tickets) {
      const spinalTicketNode = SpinalGraphService.getRealNode(
        spinalTicket.id.get()
      );
      if (await this.ticketsAreEqual(clientTicket, spinalTicketNode)) {
        console.log('ticket already exist');
        return;
      }
    }
    console.log('ticket does not exist, creating ...');
    // 2-Create ticket
    const ticketInfo = {
      name: `${clientTicket.unit_id}`,
    };
    const ticketId = await spinalServiceTicket.addTicket(
      ticketInfo,
      processId,
      context.info.id.get(),
      process.env.TMP_TICKET_TARGET_ID
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
    const tickets: SpinalNodeRef[] = [];
    for (const step of steps) {
      const stepTickets = await spinalServiceTicket.getTicketsFromStep(
        step.id.get()
      );
      tickets.push(...stepTickets);
    }

    for (const spinalTicket of tickets) {
      const spinalTicketNode = SpinalGraphService.getRealNode(
        spinalTicket.id.get()
      );
      if (await this.ticketsAreEqual(clientTicket, spinalTicketNode)) {
        console.log('ticket already exist');
        return;
      }
    }
    console.log('ticket does not exist, creating ...');
    // 2-Create ticket
    const ticketInfo = {
      name: `${clientTicket.unit_id}`,
    };
    const ticketId = await spinalServiceTicket.addTicket(
      ticketInfo,
      processId,
      context.info.id.get(),
      process.env.TMP_TICKET_TARGET_ID
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
    const tickets: SpinalNodeRef[] = [];
    for (const step of steps) {
      const stepTickets = await spinalServiceTicket.getTicketsFromStep(
        step.id.get()
      );
      tickets.push(...stepTickets);
    }

    for (const spinalTicket of tickets) {
      const spinalTicketNode = SpinalGraphService.getRealNode(
        spinalTicket.id.get()
      );
      if (await this.ticketsAreEqual(clientTicket, spinalTicketNode) ||
         clientTicket.Message.trim() == "This unit was never repaired in last 12 months") {
        console.log('ticket already exist or unit was never repaired in last 12 months');
        return;
      }
    }
    console.log('ticket does not exist, creating ...');
    // 2-Create ticket
    const ticketInfo = {
      name: `${clientTicket.unit_id}`,
    };
    const ticketId = await spinalServiceTicket.addTicket(
      ticketInfo,
      processId,
      context.info.id.get(),
      process.env.TMP_TICKET_TARGET_ID
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

  async updateAvailabilityTicket(clientTicket: IAvailabilityResponse,
    context: SpinalNode<any>,
    processId: string
  ): Promise<void> {
    // 1-Check if ticket already exist

    const steps: SpinalNodeRef[] =
      await spinalServiceTicket.getStepsFromProcess(
        processId,
        context.info.id.get()
      );
    const tickets: SpinalNodeRef[] = [];
    for (const step of steps) {
      const stepTickets = await spinalServiceTicket.getTicketsFromStep(
        step.id.get()
      );
      tickets.push(...stepTickets);
    }

    for (const spinalTicket of tickets) {
      const spinalTicketNode = SpinalGraphService.getRealNode(
        spinalTicket.id.get()
      );
      if (await this.ticketsAreEqual(clientTicket, spinalTicketNode) ||
         clientTicket.Message.trim() == "This unit was never shutdown in last 12 months") {
        console.log('ticket already exist or unit was never shutdown in last 12 months');
        return;
      }
    }
    console.log('ticket does not exist, creating ...');
    // 2-Create ticket
    const ticketInfo = {
      name: `${clientTicket.unit_id}`,
    };
    const ticketId = await spinalServiceTicket.addTicket(
      ticketInfo,
      processId,
      context.info.id.get(),
      process.env.TMP_TICKET_TARGET_ID
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
  
  async getSpinalGeo(): Promise<SpinalContext<any>> {
    const contexts = await this.graph.getChildren();
    for (const context of contexts) {
      if (context.info.id.get() === this.config.spatialContextId?.get()) {
        // @ts-ignore
        SpinalGraphService._addNode(context);
        return context;
      }
    }
    const context = await this.graph.getContext('spatial');
    if (!context) throw new Error('Context Not found');
    return context;
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

  /**
   * Initialize the context (fill the SpinalGraphService)
   *
   * @return {*}  {Promise<void>}
   * @memberof SyncRunPull
   */
  async initContext(): Promise<void> {
    const context = await this.getContext();
    const spinalGeo = await this.getSpinalGeo();
    await spinalGeo.findInContext(spinalGeo, (node) => {
      // @ts-ignore
      SpinalGraphService._addNode(node);
      return false;
    });
    await context.findInContext(context, (node): false => {
      // @ts-ignore
      SpinalGraphService._addNode(node);
      return false;
    });
  }

  dateToNumber(dateString: string | Date) {
    const dateObj = new Date(dateString);
    return dateObj.getTime();
  }

  async getUptimeEndpoint(deviceNode: SpinalNode<any>) {
    const deviceEndpoints = await deviceNode.getChildren('hasBmsEndpoint');
    const uptimeEndpoint = deviceEndpoints.find(
      (endpoint) => endpoint.info.name.get() === 'Uptime 30 days'
    );
    SpinalGraphService._addNode(uptimeEndpoint);
    return uptimeEndpoint;
  }

  async getRunCountsEndpoint(deviceNode: SpinalNode<any>) {
    const deviceEndpoints = await deviceNode.getChildren('hasBmsEndpoint');
    const runCountsEndpoint = deviceEndpoints.find(
      (endpoint) => endpoint.info.name.get() === 'Run counts'
    );
    SpinalGraphService._addNode(runCountsEndpoint);
    return runCountsEndpoint;
  }

  async getDoorCyclesEndpoint(deviceNode: SpinalNode<any>) {
    const deviceEndpoints = await deviceNode.getChildren('hasBmsEndpoint');
    const doorCyclesEndpoint = deviceEndpoints.find(
      (endpoint) => endpoint.info.name.get() === 'Door cycles'
    );
    SpinalGraphService._addNode(doorCyclesEndpoint);
    return doorCyclesEndpoint;
  }

  async updateDevice(deviceNode: SpinalNode<any>) {
    const uptimeEndpoint = await this.getUptimeEndpoint(deviceNode);
    const runCountsEndpoint = await this.getRunCountsEndpoint(deviceNode);
    const doorCyclesEndpoint = await this.getDoorCyclesEndpoint(deviceNode);

    const startDate = moment().format('YYYY-MM-DD');
    const endDate = moment().format('YYYY-MM-DD');
    try {
      const performanceData = await getPerformanceData(
        deviceNode.info.name.get(),
        startDate,
        endDate
      );

      await this.nwService.setEndpointValue(
        uptimeEndpoint.info.id.get(),
        performanceData.uptime_30days
      );
      for (const performance of performanceData.performance) {
        const runCountValue = parseInt(performance.run_counts);
        const doorCyclesValue = parseInt(performance.door_cycles);
        const newDate = this.dateToNumber(performance.date);

        /*console.log({
          "run endpoint" : runCountsEndpoint.info.id.get(),
          "door endpoint" : doorCyclesEndpoint.info.id.get(),
          "run count" : runCountValue,
          "door cycles" : doorCyclesValue,
          "date" : newDate
        });*/

        //const res = await this.timeseriesService.insertFromEndpoint(runCountsEndpoint.info.id.get(),randomInt,newDate);
        //console.log(" Insert success : ", res);
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
    } catch (e) {
      console.log(e);
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
        console.log('Device already exists,updating', elevator);
        await this.updateDevice(devices[0]);
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

        const device = new InputDataDevice(elevator, 'device');

        const uptime_30daysEndpoint = new InputDataEndpoint(
          'Uptime 30 days',
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
          'Run counts',
          runCountValue,
          '',
          InputDataEndpointDataType.Integer,
          InputDataEndpointType.Other
        );

        const doorCylcesValue = parseInt(
          elevatorPerformance[elevatorPerformance.length - 1].door_cycles
        );
        const doorCyclesEndpoint = new InputDataEndpoint(
          'Door cycles',
          doorCylcesValue,
          '',
          InputDataEndpointDataType.Integer,
          InputDataEndpointType.Other
        );

        device.children.push(runCountsEndpoint);
        device.children.push(doorCyclesEndpoint);
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
    await this.initContext();
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
    const timeout = parseInt(process.env.PULL_INTERVAL);
    console.log('pull interval : ', timeout);
    await this.waitFct(timeout);

    while (true) {
      if (!this.running) break;
      const before = Date.now();

      try {
        console.log('Pulling tickets...');
        await this.pullAndUpdateTickets();
        console.log('done.');
        console.log('Updating devices...');
        await this.createDevicesIfNotExist();
        console.log('done.');
        this.config.lastSync.set(Date.now());
      } catch (e) {
        console.error(e);
        await this.waitFct(1000 * 60);
      } finally {
        const delta = Date.now() - before;
        const timeout = parseInt(process.env.PULL_INTERVAL) - delta;
        await this.waitFct(timeout);
      }
    }
  }

  stop(): void {
    this.running = false;
  }
}
export default SyncRunPull;
