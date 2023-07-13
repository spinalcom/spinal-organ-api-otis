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

import { SpinalNode } from 'spinal-env-viewer-graph-service';
async function loadRelation(spinalNodePointer) {
  try {
    const relation = await spinalNodePointer.load();
    return relation.parent.load();
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

export async function SpinalNodeGetParent(
  node: SpinalNode<any>,
  relationNames: string[] | string
) {
  const prom = [];
  let relNames: string[] = Array.isArray(relationNames)
    ? relationNames
    : [relationNames];
  for (const [parentRelationName, nodeRelation] of node.parents) {
    for (const searchRelation of relNames) {
      if (parentRelationName === searchRelation) {
        for (var i = 0; i < nodeRelation.length; i++) {
          prom.push(loadRelation(nodeRelation[i]));
        }
      }
    }
  }
  const res = await Promise.all(prom);
  return res.filter((e) => e !== undefined);
}
