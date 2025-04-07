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

// // tslint:disable:max-line-length
// // DIConsulte : Consulte une liste de demande d'interventions.

//import { axiosInstance } from '../../utils/axiosInstance';
import { AxiosInstance } from 'axios';
import { axiosInstance } from '../../utils/axiosInstance';

export interface IAssetResponse {
  code: number;
  message: string;
  data: IAsset[];
}

export interface IAsset {
  id: number;
  name: string;
  model: string;
  type: string;
  space: string;
  client: IClient;
  devices: IDevice[];
  notifications: null; // Assuming `null` is the only value. Adjust if there are other possible types.
  devices_history: IDeviceHistory[];
  description: string;
  disabled: number;
  location: string;
  lng: number;
  lat: number;
  timezone: string;
  params: Record<string, unknown>; // Assuming an object with unknown properties. Adjust accordingly.
  initial_value: null; // Assuming `null` is the only value. Adjust if there are other possible types.
}

export interface IDeviceHistory {
  id: number;
  asset_id: number;
  device_id: string;
  from: string;
  to: string | null;
}

export interface IDevice {
  dev_id: string;
  description: string;
  sample_rate: number;
  sample_rate_extra: number;
  min_rest_between_cycles: number;
  timezone: string;
  communication: string;
  model_id: string;
  app_id: string;
  disabled: number;
  model: IModel;
  client: IClient;
  sensors: ISensor[];
  last_telemetry: ILastTelemetry[];
}

interface IModel {
  id: string;
  name: string;
  bexio_id: number;
}

interface IClient {
  id: number;
  name: string;
  disabled: number;
  parent: null; // Assuming `null` is the only value, otherwise use `any` or a specific type
  params: {
    currency: string;
    awareness_screen_feature: boolean;
  };
}

interface ISensor {
  id: number;
  sensor_id: number;
  sensor: {
    id: number;
    name: string;
    bexio_id: number;
    data_types: string[];
    temperature_probe: string;
    step_rate: number;
    frequency_factor_a: null; // Assuming `null` is the only value, otherwise use `number` or a specific type
    frequency_factor_b: null; // Assuming `null` is the only value, otherwise use `number` or a specific type
  };
  device_id: string;
  date_added: string;
  date_removed: null; // Assuming `null` is the only value, otherwise use `string` or a specific type
  stream_direction: null; // Assuming `null` is the only value, otherwise use `string` or a specific type
  stream_temperature: null; // Assuming `null` is the only value, otherwise use `number` or a specific type
  sensor_address: null; // Assuming `null` is the only value, otherwise use `string` or a specific type
  channel: number;
}

export interface ILastTelemetry {
  id: number;
  utc_time: string;
  dev_id: string;
  data_type: string;
  source: string;
  value: null; // Assuming `null` is the only value, otherwise use a specific type
  delta: null; // Assuming `null` is the only value, otherwise use a specific type
  sensor_type: null; // Assuming `null` is the only value, otherwise use a specific type
  sensor_address: string;
  channel: number;
  unit: null; // Assuming `null` is the only value, otherwise use `string` or a specific type
}

export async function getAssets(): Promise<IAssetResponse> {
  return axiosInstance.get(`/assets`).then((res) => res.data);
}
