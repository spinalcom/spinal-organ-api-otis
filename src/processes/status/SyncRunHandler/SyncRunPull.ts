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
  getAvailabilityData,
  getMaintenanceData,
  getRepairData,
  getCustomerCallBackData,
} from '../../../services/client/DIConsulte';
import { attributeService } from "spinal-env-viewer-plugin-documentation-service";


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

  constructor(graph: SpinalGraph<any>, config: OrganConfigModel) {
    this.graph = graph;
    this.config = config;
    this.running = false;
  }

  /*async updateSpinalContext(): Promise<IDemandeIntervention[]> {
    try {
      const context = await this.getContextTicket();
      return await this.updateProcessTicket(context.info.id.get());
    } catch (e) {
      console.error(e);
    }
  }*/

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
    //const repairData = await getRepairData();
    //const customerCallBackData = await getCustomerCallBackData();
    const context = await this.getContext();
    for (const ticket of availabilityData) {
        if (ticket.back_in_service_datetime == null) continue;
        console.log('availability ticket :', ticket);
        await this.updateProcessTicket(ticket,context,process.env.AVAILABILITY_PROCESS_NAME)
    }
    for (const ticket of maintenanceData) {  
      console.log('maintenance ticket :', ticket);
      await this.updateProcessTicket(ticket,context,process.env.MAINTENANCE_PROCESS_NAME)
    }
    /*for (const ticket of repairData) {
      console.log('repair ticket :', ticket);
      await this.updateProcessTicket(ticket,context,process.env.REPAIR_PROCESS_NAME)
    }
    for (const ticket of customerCallBackData) {
      console.log('customerCallBack ticket :', ticket);
      await this.updateProcessTicket(ticket,context,process.env.CUSTOMER_CALL_BACK_PROCESS_NAME)
    }*/

  }

  async ticketsAreEqual(
    clientTicket:
      | IAvailabilityResponse
      | ICustomerCallBackResponse
      | IMaintenanceResponse
      | IRepairResponse,
    spinalTicket: SpinalNode<any>
  ): Promise<boolean> {
    const attributes = await attributeService.getAttributesByCategory(spinalTicket,'OTIS')
    //console.log('All attributes to test : ',attributes);
    for(const attr of attributes){
      //console.log(`Testing ${attr.value.get()} and ${clientTicket[attr.label.get()]}`)
      if (attr.value.get() != clientTicket[attr.label.get()]) return false;
    }
    return true;
  }

  async updateProcessTicket(
    clientTicket: | IAvailabilityResponse
    | ICustomerCallBackResponse
    | IMaintenanceResponse
    | IRepairResponse,
    context: SpinalNode<any>,
    processName : string
  ): Promise<void> {
    // 1-Check if ticket already exist

    const processes = await spinalServiceTicket.getAllProcess(
      context.info.id.get()
    );
    const correctProcess = processes.find(
      (proc) => proc.name.get() === processName
    );
    if (!process) return console.error('Process not found');
    const step = await spinalServiceTicket.getFirstStep(
      correctProcess.id.get(),
      context.info.id.get()
    );
    const tickets: SpinalNodeRef[] =
      await spinalServiceTicket.getTicketsFromStep(step);
    
    for (const spinalTicket of tickets) {
      const spinalTicketNode = SpinalGraphService.getRealNode(spinalTicket.id.get());
      if (await this.ticketsAreEqual(clientTicket, spinalTicketNode)) {
        console.log('ticket already exist');
        return;
      }
    }
    console.log('ticket does not exist, creating ...');
    // 2-Create ticket
    const ticketInfo = {
      name : clientTicket.unit_id,
    };
    const ticketId = await spinalServiceTicket.addTicket(ticketInfo,correctProcess.id.get(),context.info.id.get(),process.env.TMP_TICKET_TARGET_ID);
    if(typeof ticketId !== 'string') return console.error(ticketId);
    const ticketNode = SpinalGraphService.getRealNode(ticketId);
    const category = await attributeService.addCategoryAttribute(ticketNode, 'OTIS')
    for(const key of Object.keys(clientTicket)){
      attributeService.addAttributeByCategory(ticketNode,category,key,clientTicket[key],'string');
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

  async clearLinks(parentId, relationName, relationType) {
    let realNode = SpinalGraphService.getRealNode(parentId);
    // @ts-ignore
    SpinalGraphService._addNode(realNode);

    if (realNode.hasRelation(relationName, relationType)) {
      const children = await realNode.getChildren(relationName);
      for (var elt in children) {
        let realChildNode = children[elt];
        await realNode.removeChild(realChildNode, relationName, relationType);
      }
      await realNode.removeRelation(relationName, relationType);
    }
  }

  async clearTickets() {
    console.log('Clearing tickets...');
    const context = await this.getContext();
    const tickets = await context.findInContext(context, (node) => {
      return node.info.type.get() === SPINAL_TICKET_SERVICE_TICKET_TYPE;
    });
    console.log('tickets ', tickets.length);
    for (const ticket of tickets) {
      await ticket.removeFromGraph();
    }
    const steps = await context.findInContext(context, (node) => {
      return node.info.type.get() === SPINAL_TICKET_SERVICE_STEP_TYPE;
    });
    for (const step of steps) {
      await this.clearLinks(
        step.info.id.get(),
        SPINAL_TICKET_SERVICE_TICKET_RELATION_NAME,
        SPINAL_RELATION_PTR_LST_TYPE
      );
    }
    console.log('Clearing tickets ... DONE !');
  }

  async init(): Promise<void> {
    console.log('Initiating SyncRunPull');
    await this.initContext();
    try {
      await this.pullAndUpdateTickets();
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
