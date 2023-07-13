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

/**
 * Exemple de réponse de l'api
 * @example
 * [{
        "unit_id": "ABC12345",
        "unit_display_name": "GAUCHE",
        "building_id": "12345-1",
        "building_name": "XYZ Towers",
        "street_address": "ABC Lane 2",
        "city": "XYZ",
        "postal_code": "12345",
        "call_datetime": "2021-01-04 17:08:58.0",
        "caller_name": "Mr. Green",
        "mechanic_dispatched": "2021-01-04 17:18:28.0",
        "mechanic_arrived": "2021-01-04 17:37:39.0",
        "mechanic_name": "JOHN DOE",
        "closeout_datetime": "2021-01-04 17:37:39.0",
        "customer_percept_text": "Appareil en panne",
        "customer_service_request_id": "CB5422064234",
        "resolution": "Vérification / NettoyageNon Concerné",
        "Message": "Data Available"
    },
    {
        "unit_id": "ABC12345",
        "unit_display_name": "GAUCHE",
        "building_id": "12345-1",
        "building_name": "XYZ Towers",
        "street_address": "ABC Lane 2",
        "city": "XYZ",
        "postal_code": "12345",
        "call_datetime": "2021-01-06 17:08:58.0",
        "caller_name": "Mary Sue",
        "mechanic_dispatched": "2021-01-06 17:20:58.0",
        "mechanic_arrived": "2021-01-06 17:37:39.0",
        "mechanic_name": "JOHN DOE",
        "closeout_datetime": "2021-01-06 17:37:39.0",
        "customer_percept_text": "Défaut de la chaîne de sécurité",
        "customer_service_request_id": "CB5422064234",
        "resolution": "Remplacement de la pièce",
        "Message": "Data Available"
    }
  ]
 * 
 *
 * @export
 * @interface ICustomerCallBackResponse
 */
export interface ICustomerCallBackResponse {
  unit_id: string;
  unit_display_name: string;
  building_id: string;
  building_name: string;
  street_address: string;
  city: string;
  postal_code: string;
  call_datetime: Date;
  caller_name: string;
  mechanic_dispatched: string;
  mechanic_arrived: string;
  mechanic_name: string;
  closeout_datetime: string;
  customer_percept_text: string;
  customer_service_request_id: string;
  resolution: string;
  Message: string;
}

/**
 * Exemple de réponse de l'api
 * @example
 * [{
    "unit_id": "ABC12345",
    "unit_display_name": "GAUCHE",
    "building_id": "12345-1",
    "building_name": "XYZ Towers",
    "street_address": "ABC Lane 2",
    "city": "XYZ",
    "postal_code": "12345",
    "mechanic_name": "JOHN DOE",
    "stop_datetime": "2020-02-21T00:00:00.0000000+00:00",
    "back_in_service_datetime": "2020-02-21T00:00:00.0000000+00:00",
    "resolution": "ArrÃªt pour panne technique",
    "Message": "This unit was never shutdown in last 12 months"
}]
 *
 * @export
 * @interface IAvailabilityResponse
 */
export interface IAvailabilityResponse {
  unit_id: string;
  unit_display_name: string;
  building_id: string;
  building_name: string;
  street_address: string;
  city: string;
  postal_code: string;
  mechanic_name: string;
  stop_datetime: string;
  back_in_service_datetime: string;
  resolution: string;
  Message: string;
}

/**
 * Exemple de réponse de l'api
 * [{
    "unit_id": "ABC12345",
    "unit_display_name": "GAUCHE",
    "building_id": "12345-1",
    "building_name": "XYZ Towers",
    "street_address": "ABC Lane 2",
    "city": "XYZ",
    "postal_code": "12345",
    "completed_date": "2020-02-21T00:00:00.0000000+00:00",
    "mechanic_name": "JOHN DOE",
    "type_of_visit": "Visite annuelle de maintenance",
    "resolution": "Visite annuelle de maintenance",
    "Message": "Data Available"
}]
 *
 * @export
 * @interface IMaintenanceResponse
 */
export interface IMaintenanceResponse {
  unit_id: string;
  unit_display_name: string;
  building_id: string;
  building_name: string;
  street_address: string;
  city: string;
  postal_code: string;
  completed_date: string;
  mechanic_name: string;
  type_of_visit: string;
  resolution: string;
  Message: string;
}

/**
 * Exemple de réponse de l'api
 * [{
    "unit_id": "ABC12345",
    "unit_display_name": "GAUCHE",
    "building_id": "12345-1",
    "building_name": "XYZ Towers",
    "street_address": "ABC Lane 2",
    "city": "XYZ",
    "postal_code": "12345",
    "restart_datetime": "2020-02-21T00:00:00.0000000+00:00",
    "mechanic_name": "JOHN DOE",
    "repair_description": "Graissage / lubrification",
    "Message": "Data Available"
}]
 *
 * @export
 * @interface IRepairResponse
 */
export interface IRepairResponse {
  unit_id: string;
  unit_display_name: string;
  building_id: string;
  building_name: string;
  street_address: string;
  city: string;
  postal_code: string;
  restart_datetime: string;
  mechanic_name: string;
  repair_description: string;
  Message: string;
}




export async function getAvailabilityData(
): Promise<IAvailabilityResponse[]> {
  const config = {
    headers: {
      'Ocp-Apim-Subscription-Key' : process.env.OTIS_AVAILABILITY_SUBSCRIPTION_KEY
    }
  }
  return axiosInstance
    .get(`/elevatoravailability/api/latestavailability?country_code=${process.env.COUNTRY_CODE}&customer_id=${process.env.CUSTOMER_ID}&contract_no=${process.env.CONTRACT_NUMBER}`, config)
    .then((res) => res.data);
}

export async function getMaintenanceData(
): Promise<IMaintenanceResponse[]> {
  const config = {
    headers: {
      'Ocp-Apim-Subscription-Key' : process.env.OTIS_MAINTENANCE_SUBSCRIPTION_KEY
    }
  }
  return axiosInstance
    .get(`/elevatormaintenance/api/latestmaintenanceinfo?country_code=${process.env.COUNTRY_CODE}&customer_id=${process.env.CUSTOMER_ID}&contract_no=${process.env.CONTRACT_NUMBER}`,config)
    .then((res) => res.data);
}

export async function getRepairData(
): Promise<IRepairResponse[]> {
  const config = {
    headers: {
      'Ocp-Apim-Subscription-Key' : process.env.OTIS_REPAIR_SUBSCRIPTION_KEY
    }
  }
  return axiosInstance
    .get(`/elevatorrepair/api/latestrepairinfo?country_code=${process.env.COUNTRY_CODE}&customer_id=${process.env.CUSTOMER_ID}&contract_no=${process.env.CONTRACT_NUMBER}`,config)
    .then((res) => res.data);
}

export async function getCustomerCallBackData(
): Promise<ICustomerCallBackResponse[]> {
  const config = {
    headers: {
      'Ocp-Apim-Subscription-Key' : process.env.OTIS_CUSTOMER_CALLBACK_SUBSCRIPTION_KEY
    }
  }
  return axiosInstance
    .get(`/callback/api/latestcallbackinfo?country_code=${process.env.COUNTRY_CODE}&customer_id=${process.env.CUSTOMER_ID}&contract_no=${process.env.CONTRACT_NUMBER}`,config)
    .then((res) => res.data);

}
