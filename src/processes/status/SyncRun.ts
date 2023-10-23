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

import { SpinalGraphService, SpinalContext, SpinalGraph, SpinalNode } from 'spinal-env-viewer-graph-service';
import { GEO_BUILDING_TYPE, GEO_FIND_BUILDING, GEO_FLOOR_TYPE, GEO_ROOM_TYPE } from '../../constants';
import OrganConfigModel from '../../model/OrganConfigModel';
import IStatus from './IStatus';
import SyncRunPull from './SyncRunHandler/SyncRunPull';
import { join as resolvePath } from 'path';
import { NetworkService } from "spinal-model-bmsnetwork";






export default class SyncRun implements IStatus {
  graph: SpinalGraph<any>;
  config: OrganConfigModel;
  syncRunPull: SyncRunPull;
  nwService: NetworkService;

  constructor(graph: SpinalGraph<any>, config: OrganConfigModel,nwService: NetworkService) {
    this.graph = graph;
    this.config = config;
    this.nwService = nwService;
    this.syncRunPull = new SyncRunPull(graph, config, nwService);
    
  }


  async start(): Promise<number> {
    console.log('start SyncRun');

    //await this.syncRunHub.init(this.clientBuildingId,map,this.axiosClient);
    await this.syncRunPull.init();
    await this.syncRunPull.run();
    return 0;
  }

  stop(): void {
    console.log('stop SyncRun');
    this.syncRunPull.stop();
  }
}
