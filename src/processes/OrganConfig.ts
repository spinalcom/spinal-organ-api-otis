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

import SpinalIO from '../services/SpinalIO';
import * as config from '../../config';
import { resolve as PathResolve } from 'path';
import OrganConfigModel from '../model/OrganConfigModel';
export default class OrganConfig {
  private static instance: OrganConfig = null;
  constructor() {}

  // if 
  static getInstance() {
    if (OrganConfig.instance !== null) return OrganConfig.instance;
    OrganConfig.instance = new OrganConfig();
    return OrganConfig.instance;
  }

  async getConfig() {
    const spinalIO = SpinalIO.getInstance(config.spinalhub);
    const loadPath = PathResolve(config.organ.configPath, config.organ.name);
    let cfg: OrganConfigModel;
    try {
      cfg = await spinalIO.load(loadPath);
    } catch (e) {
      console.log('Config not found, therefore creating...');
      cfg = new OrganConfigModel();
      console.log('Created...');
      console.log('Initiating with environment variables...');
      cfg.initEnv();
      console.log('Initiated with environment variables...');
      await spinalIO.store(loadPath, cfg);
    }
    cfg.restart.set(false);
    cfg.bindRestart();
    return cfg;
  }
}
