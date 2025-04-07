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
import type OrganConfigModel from '../../../model/OrganConfigModel';
import {
  IAssetResponse,
  ILastTelemetry,
  IDevice,
  IAsset,
  getAssets
} from '../../../services/client/DIConsulte';
import { attributeService } from 'spinal-env-viewer-plugin-documentation-service';
import { NetworkService, SpinalBmsEndpoint } from 'spinal-model-bmsnetwork';
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
  nwService: NetworkService;
  networkContext: SpinalNode<any>;
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
  }

  async getNetworkContext(): Promise<SpinalNode<any>> {
    const contexts = await this.graph.getChildren();
    for (const context of contexts) {
      if (context.info.name.get() === process.env.NETWORK_CONTEXT_NAME) {
        // @ts-ignore
        SpinalGraphService._addNode(context);
        return context;
      }
    }
    throw new Error('Network Context Not found');
  }

  async initNetworkContext(): Promise<SpinalNode<any>> {
    const context = await this.getNetworkContext();
    this.networkContext = context;
    return context;
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

  async addAttributesToDevice(node: SpinalNode<any>,asset: IAsset, device: IDevice) {
      
      await attributeService.addAttributeByCategoryName(node, 'Asset', 'Name', asset.name),
      await attributeService.addAttributeByCategoryName(node, 'Asset', 'Id', String(asset.id)),
      await attributeService.addAttributeByCategoryName(node, 'Asset', 'Type', asset.type),
      await attributeService.addAttributeByCategoryName(node, 'Asset', 'Space', asset.space),
      await attributeService.addAttributeByCategoryName(node, 'Device', 'Description', device.description),
      await attributeService.addAttributeByCategoryName(node, 'Device', 'Sample rate', String(device.sample_rate)),
      await attributeService.addAttributeByCategoryName(node, 'Device', 'Sample rate extra', String(device.sample_rate_extra)),
      await attributeService.addAttributeByCategoryName(node, 'Device', 'Sample rate extra', String(device.min_rest_between_cycles))
    
      console.log('Attributes added to device ', device.dev_id);

  }

  async createEndpoint(
    deviceId: string,
    endpointData : ILastTelemetry
  ) {
    const context = await this.getNetworkContext();;
    const endpointNodeModel = new InputDataEndpoint(`${endpointData.data_type}-${endpointData.id}`, endpointData.value, endpointData.unit, InputDataEndpointDataType.Real, InputDataEndpointType.Other);

    const res = new SpinalBmsEndpoint(
      endpointNodeModel.name,
      endpointNodeModel.path,
      endpointNodeModel.currentValue,
      endpointNodeModel.unit,
      InputDataEndpointDataType[endpointNodeModel.dataType],
      InputDataEndpointType[endpointNodeModel.type],
      endpointNodeModel.id
    );
    const childId = SpinalGraphService.createNode(
      { type: SpinalBmsEndpoint.nodeTypeName, name: endpointNodeModel.name },
      res
    );
    await SpinalGraphService.addChildInContext(
      deviceId,
      childId,
      context.getId().get(),
      SpinalBmsEndpoint.relationName,
      SPINAL_RELATION_PTR_LST_TYPE
    );

    const node = SpinalGraphService.getRealNode(childId);
    //await this.addEndpointAttributes(node,measure);
    return node;
  }


  async createDevice(deviceName) {
    const deviceNodeModel = new InputDataDevice(deviceName, 'device');
    await this.nwService.updateData(deviceNodeModel);
    console.log('Created device ', deviceName);
  }



  
  async createDevicesIfNotExist(assetData: IAsset[]) {
    const networkContext = await this.getNetworkContext();

    for (const asset of assetData) {
      for(const device of asset.devices) {
        console.log(device.dev_id);
        const devices = await networkContext.findInContext(
          networkContext,
          (node) => node.getName().get() == device.dev_id
        );
        if (devices.length > 0) {
          console.log('Device already exists, not creating ', device.dev_id);
          continue;
        }

        const deviceNode = new InputDataDevice(device.dev_id, 'device');
        await this.nwService.updateData(deviceNode)
        console.log('Device created :', device.dev_id);
      }
    }
  }

  async updateDeviceData(assetData : IAsset[]){
    console.log('Starting update data cycle ...');
    const networkContext = await this.getNetworkContext();
    for(const asset of assetData){
      for(const device of asset.devices){
        let deviceNode = await networkContext.findOneInContext(
          networkContext,
          (node) => node.getName().get() === device.dev_id
        )
        
        if (!deviceNode){
          await this.createDevice(device.dev_id);
          deviceNode = await networkContext.findOneInContext(
            networkContext,
            (node) => node.getName().get() === device.dev_id
          )
          SpinalGraphService._addNode(deviceNode);
          await this.addAttributesToDevice(deviceNode, asset, device);
        }

        SpinalGraphService._addNode(deviceNode);

        // Look for endpoints
        const endpoints = await deviceNode.getChildren('hasBmsEndpoint');

        for(const telemetry of device.last_telemetry){
          if(telemetry.value === null) continue;

          let endpointNode = endpoints.find((endpoint) => endpoint.getName().get() === `${telemetry.data_type}-${telemetry.id}`);
          
          if(!endpointNode){
            //create new endpoint
            //const newEndpoint = new InputDataEndpoint(`${telemetry.data_type}-${telemetry.id}`, telemetry.value, telemetry.unit, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
            // await this.nwService.createNewBmsEndpoint(deviceNode.info.id.get(),newEndpoint);
            endpointNode = await this.createEndpoint(deviceNode.getId().get(), telemetry);
            SpinalGraphService._addNode(endpointNode);
            await this.nwService.setEndpointValue(endpointNode.info.id.get(), telemetry.value);
            await this.timeseriesService.pushFromEndpoint(
              endpointNode.info.id.get(),
              telemetry.value
            );
            const realNode = SpinalGraphService.getRealNode(
              endpointNode.getId().get()
            );
            await attributeService.updateAttribute(
              realNode,
              'default',
              'timeSeries maxDay',
              { value: '366' }
            );
          }
          SpinalGraphService._addNode(endpointNode);
          await this.nwService.setEndpointValue(
            endpointNode.info.id.get(),
            telemetry.value
          );
          await this.timeseriesService.pushFromEndpoint(
            endpointNode.info.id.get(),
            telemetry.value
          );
          //await this.timeseriesService.pushFromEndpoint(endpoint.getId().get(), telemetry.value);
          // const model = await endpoint.element.load();
          // model.currentValue.set(telemetry.value);
          
            
        }



        }
      
    }
  }

  async init(): Promise<void> {
    console.log('Initiating SyncRunPull');
    try {
      await this.initNetworkContext();
      const assetData = await getAssets();
      
      await this.updateDeviceData(assetData.data);

      this.config.lastSync.set(Date.now());
    } catch (e) {
      console.error(e);
    }
  }

  async run(): Promise<void> {
    this.running = true;
    const timeout = parseInt(process.env.PULL_INTERVAL);
    await this.waitFct(timeout);
    while (true) {
      if (!this.running) break;
      const before = Date.now();
      try {
        console.log("Updating data...");
        const assetData = await getAssets();
        await this.updateDeviceData(assetData.data);
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
