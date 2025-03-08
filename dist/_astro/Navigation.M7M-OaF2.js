import{c as l,j as e}from"./createReactComponent.BjElqMMB.js";import{r}from"./index.5XC2200L.js";import{I as c}from"./IconSearch.DKw--zju.js";/**
 * @license @tabler/icons-react v3.29.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var o=l("outline","archive","IconArchive",[["path",{d:"M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z",key:"svg-0"}],["path",{d:"M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-10",key:"svg-1"}],["path",{d:"M10 12l4 0",key:"svg-2"}]]);/**
 * @license @tabler/icons-react v3.29.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var h=l("outline","menu-2","IconMenu2",[["path",{d:"M4 6l16 0",key:"svg-0"}],["path",{d:"M4 12l16 0",key:"svg-1"}],["path",{d:"M4 18l16 0",key:"svg-2"}]]);/**
 * @license @tabler/icons-react v3.29.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var m=l("outline","moon","IconMoon",[["path",{d:"M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z",key:"svg-0"}]]);/**
 * @license @tabler/icons-react v3.29.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var d=l("outline","sun","IconSun",[["path",{d:"M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0",key:"svg-0"}],["path",{d:"M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7",key:"svg-1"}]]);function u({children:s,className:n,...a}){return e.jsx("a",{className:`group inline-block hover:text-theme-accent hover:underline  underline-offset-8 ${n}`,...a,children:s})}function v({active:s}){const[n,a]=r.useState(!1);return e.jsxs("nav",{className:"flex grow items-center justify-end",children:[e.jsx("button",{className:"sm:hidden",onClick:()=>a(!n),children:e.jsx(h,{})}),e.jsxs("ul",{className:`${n?"active":"inactive"} menu absolute z-50 flex flex-col sm:flex-row sm:static items-center gap-6 font-mono py-6 sm:py-0 top-24  bg-theme-fill left-0 right-0 transition-all overflow-hidden`,children:[e.jsx(t,{href:"posts",active:s,children:"Posts"}),e.jsx(t,{href:"projects",active:s,children:"Projects"}),e.jsx(t,{href:"tags",active:s,children:"Tags"}),e.jsx(t,{href:"about",active:s,children:"About"}),e.jsxs(t,{href:"archives",active:s,className:"gap-1",children:[e.jsx(o,{}),e.jsx("span",{className:"sm:hidden",children:"Archive"})]}),e.jsx("li",{children:e.jsxs(u,{href:"/search/",className:`focus-outline p-3 sm:p-1 ${s==="search"?"active":""} flex`,title:"Search",children:[e.jsx(c,{fill:"red",fillOpacity:0}),e.jsx("span",{className:"sm:hidden",children:"Search"})]})}),e.jsx("li",{children:e.jsxs("button",{id:"theme-btn",className:"focus-outline inline-flex items-center",title:"Toggles light & dark","aria-label":"auto","aria-live":"polite",children:[e.jsx(m,{id:"moon-svg"}),e.jsx(d,{id:"sun-svg"}),e.jsx("span",{className:"sm:hidden",children:"Theme"})]})})]})]})}function t({active:s,href:n,children:a,className:i}){return e.jsx("li",{className:`inline-flex items-center ${s===n?"active":""}`,children:e.jsx("a",{href:`/${n}/`,className:`inline-flex items-center ${i}`,children:a})})}export{v as default};
