import{r as i}from"./index.5XC2200L.js";var p={exports:{}},u={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var h=i,k=Symbol.for("react.element"),v=Symbol.for("react.fragment"),E=Object.prototype.hasOwnProperty,g=h.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,R={key:!0,ref:!0,__self:!0,__source:!0};function m(o,e,l){var r,t={},n=null,s=null;l!==void 0&&(n=""+l),e.key!==void 0&&(n=""+e.key),e.ref!==void 0&&(s=e.ref);for(r in e)E.call(e,r)&&!R.hasOwnProperty(r)&&(t[r]=e[r]);if(o&&o.defaultProps)for(r in e=o.defaultProps,e)t[r]===void 0&&(t[r]=e[r]);return{$$typeof:k,type:o,key:n,ref:s,props:t,_owner:g.current}}u.Fragment=v;u.jsx=m;u.jsxs=m;p.exports=u;var b=p.exports;/**
 * @license @tabler/icons-react v3.29.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var j={outline:{xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},filled:{xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"currentColor",stroke:"none"}};/**
 * @license @tabler/icons-react v3.29.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=(o,e,l,r)=>{const t=i.forwardRef(({color:n="currentColor",size:s=24,stroke:c=2,title:f,className:d,children:a,...w},_)=>i.createElement("svg",{ref:_,...j[o],width:s,height:s,className:["tabler-icon",`tabler-icon-${e}`,d].join(" "),strokeWidth:c,stroke:n,...w},[f&&i.createElement("title",{key:"svg-title"},f),...r.map(([x,y])=>i.createElement(x,y)),...Array.isArray(a)?a:[a]]));return t.displayName=`${l}`,t};export{C as c,b as j};
