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
import spinalEnvViewerContextGeographicService from 'spinal-env-viewer-context-geographic-service';
export {
  SPINAL_TICKET_SERVICE_STEP_RELATION_NAME,
  SPINAL_TICKET_SERVICE_STEP_TYPE,
  SPINAL_TICKET_SERVICE_TICKET_RELATION_NAME,
  SPINAL_TICKET_SERVICE_TICKET_TYPE,
  SPINAL_TICKET_SERVICE_PROCESS_RELATION_NAME,
} from 'spinal-service-ticket/dist/Constants';
const geoConstants = spinalEnvViewerContextGeographicService.constants;

export const GEO_CONTEXT_TYPE = geoConstants.CONTEXT_TYPE;
export const GEO_SITE_TYPE = geoConstants.SITE_TYPE;
export const GEO_BUILDING_TYPE = geoConstants.BUILDING_TYPE;
export const GEO_FLOOR_TYPE = geoConstants.FLOOR_TYPE;
export const GEO_ZONE_TYPE = geoConstants.ZONE_TYPE;
export const GEO_ROOM_TYPE = geoConstants.ROOM_TYPE;
export const GEO_EQUIPMENT_TYPE = geoConstants.EQUIPMENT_TYPE;
export const GEO_REFERENCE_TYPE = geoConstants.REFERENCE_TYPE;

export const GEO_EQUIPMENT_RELATION = geoConstants.EQUIPMENT_RELATION;

export const GEO_REFERENCE_ROOM_RELATION = geoConstants.REFERENCE_RELATION + ".ROOM";

export const GEO_FIND_BUILDING = [
  geoConstants.SITE_RELATION,
  geoConstants.BUILDING_RELATION,
  geoConstants.ZONE_RELATION,
];

export const GEO_FIND_FLOOR = [
  geoConstants.ZONE_RELATION,
  geoConstants.FLOOR_RELATION,
];

export const GEO_FIND_ROOM = [
  geoConstants.ZONE_RELATION,
  geoConstants.ROOM_RELATION,
];

export const GEO_FIND_EQUIPMENT = [
  geoConstants.ZONE_RELATION,
  geoConstants.REFERENCE_RELATION,
  geoConstants.EQUIPMENT_RELATION,
  GEO_REFERENCE_ROOM_RELATION
];

export const GEO_RELATIONS = [
  geoConstants.SITE_RELATION,
  geoConstants.BUILDING_RELATION,
  geoConstants.FLOOR_RELATION,
  geoConstants.ROOM_RELATION,
  geoConstants.REFERENCE_RELATION,
  geoConstants.EQUIPMENT_RELATION,
  geoConstants.ZONE_RELATION,
  GEO_REFERENCE_ROOM_RELATION
];
export const GEOGRAPHIC_TYPES = geoConstants.GEOGRAPHIC_TYPES;

export const GEO_NODE_TYPES = [
  GEO_SITE_TYPE,
  GEO_BUILDING_TYPE,
  GEO_FLOOR_TYPE,
  GEO_ZONE_TYPE,
  GEO_ROOM_TYPE,
];

