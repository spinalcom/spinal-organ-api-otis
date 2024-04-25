/*
 * Copyright 2018 SpinalCom - www.spinalcom.com
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

import {
  FileSystem,
  File,
  Ptr,
  spinalCore,
} from 'spinal-core-connectorjs';
const configJson = require('../../config');
import ConfigFile from 'spinal-lib-organ-monitoring';

export interface SpinalConfig {
  protocol: string;
  host: string;
  port?: string | number;
  userID: string | number;
  userPassword: string;
}
export default class SpinalIO {
  private static instance: SpinalIO = null;
  config: SpinalConfig;
  conn: spinal.FileSystem;
  mapLoad: Map<string, Promise<any>>;
  mapLoadPtr: Map<number, Promise<any>>;
  private constructor(config?: SpinalConfig) {
    this.mapLoadPtr = new Map();
    this.mapLoad = new Map();
    if (!config) {
      this.config = require('../../config').spinalhub;
    } else {
      this.config = config;
    }
    let connectOpt = `${this.config.protocol}://${this.config.userID}:${this.config.userPassword}@${this.config.host}`;
    if (this.config.port) connectOpt += `:${this.config.port}/`;
    this.conn = spinalCore.connect(connectOpt);
    ConfigFile.init(
      this.conn,
      `${configJson.organ.name}`,
      "Connector",
      config.host,
      parseInt(config.port as string)
    );
  }

  static getInstance(config?: SpinalConfig) {
    if (SpinalIO.instance !== null) {
      return SpinalIO.instance;
    }
    SpinalIO.instance = new SpinalIO(config);

    return SpinalIO.instance;
  }

  store<T extends spinal.Model>(path: string, model: T): Promise<void> {
    const prom: Promise<void> = new Promise((resolve, reject) => {
      spinalCore.store(
        this.conn,
        model,
        path,
        () => {
          resolve();
        },
        () => {
          reject();
        }
      );
    });
    return prom;
  }

  load<T extends spinal.Model>(path: string): Promise<T> {
    console.log(`load : ${path}`);
    if (this.mapLoad.has(path) === true) return this.mapLoad.get(path);
    const prom: any = new Promise((resolve, reject) => {
      spinalCore.load(
        this.conn,
        path,
        (model) => {
          resolve(model);
        },
        () => {
          this.mapLoad.delete(path);
          reject();
        }
      );
    });
    this.mapLoad.set(path, prom);
    return prom;
  }

  loadModelPtr<T extends spinal.Model>(
    model: spinal.Ptr<T> | spinal.File<T>
  ): Promise<T> {
    if (model instanceof File) {
      return this.loadModelPtr(model._ptr);
    }
    if (!(model instanceof Ptr)) {
      throw new Error('loadModelPtr must take Ptr as parameter');
    }
    if (!model.data.value && model.data.model) {
      return Promise.resolve(model.data.model);
    }
    if (!model.data.value) {
      throw new Error('Trying to load a Ptr to 0');
    }

    if (this.mapLoadPtr.has(model.data.value)) {
      return this.mapLoadPtr.get(model.data.value);
    }
    if (typeof FileSystem._objects[model.data.value] !== 'undefined') {
      const promise: any = Promise.resolve(
        FileSystem._objects[model.data.value]
      );
      this.mapLoadPtr.set(model.data.value, promise);
      return promise;
    }
    const promise: Promise<T> = new Promise((resolve, reject) => {
      model.load((m) => {
        if (!m) {
          this.mapLoadPtr.delete(model.data.value);
          reject(new Error('Error in load Ptr'));
        } else {
          resolve(m);
        }
      });
    });
    this.mapLoadPtr.set(model.data.value, promise);
    return promise;
  }
}
