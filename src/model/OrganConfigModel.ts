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

import { spinalCore, Model } from 'spinal-core-connectorjs_type';

export default class OrganConfigModel extends Model {
  digitalTwinPath: spinal.Str;
  ticketContextId: spinal.Str;
  spatialContextId: spinal.Str;
  
  pullInterval: spinal.Val;
  lastSync: spinal.Val;
  restart: spinal.Bool;

  constructor() {
    super();
    this.add_attr('digitalTwinPath', '/__users__/admin/Digital twin VF');
    this.add_attr('spatialContextId', '')
    this.add_attr('restart', false);
    this.add_attr('pullInterval', 5 * 60 * 1000);
    this.add_attr('lastSync', 0);
    this.add_attr('organStatus', 0);
    
  }

  updateSync() {
    this.lastSync.set(Date.now());
  }
  initEnv() {
    if (process?.env.DIGITALTWIN_PATH)
      this.digitalTwinPath.set(process.env.DIGITALTWIN_PATH);
    if (process?.env.SPATIAL_CONTEXT_ID)
      this.spatialContextId.set(process.env.SPATIAL_CONTEXT_ID);
    if (process?.env.PULL_INTERVAL)
      this.pullInterval.set(process.env.PULL_INTERVAL);
  }
  bindRestart() {
    this.restart.bind(() => {
      if (this.restart.get() === true) {
        console.log('Restart organ');

        process.exit(0);
      }
    });
  }
}

spinalCore.register_models(OrganConfigModel);
