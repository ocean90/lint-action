/**
 * yaml
 * 1.10.0
 * https://github.com/eemeli/yaml
 *
 * Copyright 2018 Eemeli Aro <eemeli@gmail.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose
 * with or without fee is hereby granted, provided that the above copyright notice
 * and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
 * OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
 * TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
 * THIS SOFTWARE.
 */
'use strict';

require('./PlainValue-ec8e588e.js');
var parseCst = require('./parse-cst.js');
require('./resolveSeq-4a68b39b.js');
var Document$1 = require('./Document-2cf6b08c.js');
require('./Schema-42e9705c.js');
require('./warnings-39684f17.js');

function testEvents(src, options) {
  const opt = Object.assign({
    keepCstNodes: true,
    keepNodeTypes: true,
    version: '1.2'
  }, options);
  const docs = parseCst.parse(src).map(cstDoc => new Document$1.Document(opt).parse(cstDoc));
  const errDoc = docs.find(doc => doc.errors.length > 0);
  const error = errDoc ? errDoc.errors[0].message : null;
  const events = ['+STR'];

  try {
    for (let i = 0; i < docs.length; ++i) {
      const doc = docs[i];
      let root = doc.contents;
      if (Array.isArray(root)) root = root[0];
      const [rootStart, rootEnd] = doc.range || [0, 0];
      let e = doc.errors[0] && doc.errors[0].source;
      if (e && e.type === 'SEQ_ITEM') e = e.node;
      if (e && (e.type === 'DOCUMENT' || e.range.start < rootStart)) throw new Error();
      let docStart = '+DOC';
      const pre = src.slice(0, rootStart);
      const explicitDoc = /---\s*$/.test(pre);
      if (explicitDoc) docStart += ' ---';else if (!doc.contents) continue;
      events.push(docStart);
      addEvents(events, doc, e, root);
      if (doc.contents && doc.contents.length > 1) throw new Error();
      let docEnd = '-DOC';

      if (rootEnd) {
        const post = src.slice(rootEnd);
        if (/^\.\.\./.test(post)) docEnd += ' ...';
      }

      events.push(docEnd);
    }
  } catch (e) {
    return {
      events,
      error: error || e
    };
  }

  events.push('-STR');
  return {
    events,
    error
  };
}

function addEvents(events, doc, e, node) {
  if (!node) {
    events.push('=VAL :');
    return;
  }

  if (e && node.cstNode === e) throw new Error();
  let props = '';
  let anchor = doc.anchors.getName(node);

  if (anchor) {
    if (/\d$/.test(anchor)) {
      const alt = anchor.replace(/\d$/, '');
      if (doc.anchors.getNode(alt)) anchor = alt;
    }

    props = ` &${anchor}`;
  }

  if (node.cstNode && node.cstNode.tag) {
    const {
      handle,
      suffix
    } = node.cstNode.tag;
    props += handle === '!' && !suffix ? ' <!>' : ` <${node.tag}>`;
  }

  let scalar = null;

  switch (node.type) {
    case 'ALIAS':
      {
        let alias = doc.anchors.getName(node.source);

        if (/\d$/.test(alias)) {
          const alt = alias.replace(/\d$/, '');
          if (doc.anchors.getNode(alt)) alias = alt;
        }

        events.push(`=ALI${props} *${alias}`);
      }
      break;

    case 'BLOCK_FOLDED':
      scalar = '>';
      break;

    case 'BLOCK_LITERAL':
      scalar = '|';
      break;

    case 'PLAIN':
      scalar = ':';
      break;

    case 'QUOTE_DOUBLE':
      scalar = '"';
      break;

    case 'QUOTE_SINGLE':
      scalar = "'";
      break;

    case 'PAIR':
      events.push(`+MAP${props}`);
      addEvents(events, doc, e, node.key);
      addEvents(events, doc, e, node.value);
      events.push('-MAP');
      break;

    case 'FLOW_SEQ':
    case 'SEQ':
      events.push(`+SEQ${props}`);
      node.items.forEach(item => {
        addEvents(events, doc, e, item);
      });
      events.push('-SEQ');
      break;

    case 'FLOW_MAP':
    case 'MAP':
      events.push(`+MAP${props}`);
      node.items.forEach(({
        key,
        value
      }) => {
        addEvents(events, doc, e, key);
        addEvents(events, doc, e, value);
      });
      events.push('-MAP');
      break;

    default:
      throw new Error(`Unexpected node type ${node.type}`);
  }

  if (scalar) {
    const value = node.cstNode.strValue.replace(/\\/g, '\\\\').replace(/\0/g, '\\0').replace(/\x07/g, '\\a').replace(/\x08/g, '\\b').replace(/\t/g, '\\t').replace(/\n/g, '\\n').replace(/\v/g, '\\v').replace(/\f/g, '\\f').replace(/\r/g, '\\r').replace(/\x1b/g, '\\e');
    events.push(`=VAL${props} ${scalar}${value}`);
  }
}

exports.testEvents = testEvents;