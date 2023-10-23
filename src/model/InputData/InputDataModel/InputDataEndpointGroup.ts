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
  InputDataEndpointGroup as idEndpointGroup,
  SpinalBmsEndpointGroup,
} from 'spinal-model-bmsnetwork';

import { genUID } from '../../../utils/genUID';

import { InputDataEndpoint } from './InputDataEndpoint';

/**
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {string} path
 * @property {InputDataEndpoint[]} children
 * @property {string} nodeTypeName equals SpinalBmsEndpointGroup.nodeTypeName
 * @export
 * @class InputDataEndpointGroup
 * @implements {idEndpointGroup}
 */
export class InputDataEndpointGroup implements idEndpointGroup {
  public id: string;
  public name: string;
  public type: string;
  public path: string;
  public children: (InputDataEndpoint)[];
  public nodeTypeName: string;

  /**
   *Creates an instance of InputDataEndpointGroup.
   * @param {string} [name='default EndpointGroup name']
   * @param {string} [type='default EndpointGroup type']
   * @param {string} [id=genUID('InputDataEndpointGroup')]
   * @param {string} [path='default EndpointGroup path']
   * @memberof InputDataEndpointGroup
   */
  constructor(
    name: string = 'default EndpointGroup name',
    type: string = 'default EndpointGroup type',
    id: string = genUID('InputDataEndpointGroup'),
    path: string = 'default EndpointGroup path',
    ) {
    this.nodeTypeName = SpinalBmsEndpointGroup.nodeTypeName;
    this.id = id;
    this.name = name;
    this.type = type;
    this.path = path;
    this.children = [];
  }
}
