;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="2d3bdcef-61d2-30f3-88da-d74719e5369e")}catch(e){}}();
(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,95053,e=>{"use strict";var r=e.i(221628),t=e.i(766181),a=e.i(416340),o=e.i(843778),n=e.i(20482),i=e.i(737018),l=e.i(282410);let s=(0,t.cva)("relative grid gap-10",{variants:{size:{tiny:"text-xs",small:"text-base md:text-sm leading-4",medium:"text-base md:text-sm",large:"text-base",xlarge:"text-base"},align:{left:"",right:""},responsive:{true:"",false:""},layout:{horizontal:"flex flex-col gap-2 md:grid md:grid-cols-12",vertical:"flex flex-col gap-2",flex:"flex flex-row gap-3","flex-row-reverse":"flex flex-col-reverse gap-2 md:gap-6 md:flex-row-reverse md:justify-between"},flex:{true:"",false:""}},compoundVariants:[{layout:"flex",align:"right",className:"justify-between"},{layout:"flex-row-reverse",align:"right",className:"justify-between"}],defaultVariants:{}}),d=(0,t.cva)("transition-all duration-500 ease-in-out",{variants:{flex:{true:"",false:""},align:{left:"",right:""},layout:{horizontal:"flex flex-col gap-2 col-span-4",vertical:"flex flex-row gap-2 justify-between",flex:"flex flex-col gap-0 min-w-0","flex-row-reverse":"flex flex-col min-w-0 grow"},labelLayout:{horizontal:"",vertical:"","":""}},compoundVariants:[{flex:!0,align:"left",className:"order-2"},{flex:!0,align:"right",className:"order-1"},{layout:["vertical","flex"],labelLayout:void 0,flex:!1,className:"flex flex-row gap-2 justify-between"},{layout:"horizontal",className:"flex flex-col gap-2"}],defaultVariants:{}}),u=(0,t.cva)("transition-all duration-500 ease-in-out",{variants:{flex:{true:"",false:""},align:{left:"order-1",right:"order-2"},layout:{horizontal:"",vertical:"",flex:"","flex-row-reverse":""}},compoundVariants:[{flex:!0,align:"left",className:"order-1"},{flex:!0,align:"right",className:"order-2"},{layout:["vertical","flex"],className:"col-span-12"},{layout:"horizontal",align:"left",className:"col-span-8"},{layout:"horizontal",align:"right",className:"text-right"}],defaultVariants:{}}),c=(0,t.cva)("text-foreground-lighter leading-normal",{variants:{size:{...l.SIZE.text},layout:{vertical:"mt-2",horizontal:"mt-2",flex:"","flex-row-reverse":""}},defaultVariants:{}}),f=(0,t.cva)("text-foreground-muted",{variants:{size:{...l.SIZE.text}},defaultVariants:{}}),p=(0,t.cva)("text-foreground-muted",{variants:{size:{...l.SIZE.text}},defaultVariants:{}}),g=(0,t.cva)("text-foreground-muted",{variants:{size:{...l.SIZE.text}},defaultVariants:{}}),x=(0,t.cva)("",{variants:{flex:{true:"",false:""},align:{left:"",right:""},layout:{horizontal:"",vertical:"",flex:"","flex-row-reverse":""}},compoundVariants:[{flex:!0,align:"left",className:""},{flex:!0,align:"right",className:"order-last"},{layout:"flex-row-reverse",className:"flex flex-col justify-center items-start md:items-end shrink-0 md:w-1/2 xl:w-2/5 [&>div]:md:w-full"}]}),m=(0,t.cva)("",{variants:{nonBoxInput:{true:"",false:""},label:{true:"",false:""},layout:{vertical:"",horizontal:"","flex-row-reverse":""}},compoundVariants:[{nonBoxInput:!0,label:!0,layout:"vertical",className:"my-3"},{nonBoxInput:!0,label:!0,layout:"horizontal",className:"my-3 md:mt-0 mb-3"}],defaultVariants:{}}),b=a.default.forwardRef(({align:e="left",className:t,description:a,id:l,label:b,labelOptional:h,layout:v="vertical",style:y,labelLayout:w,size:_="medium",beforeLabel:j,afterLabel:z,nonBoxInput:k=!b,hideMessage:A=!1,isReactForm:N,error:C,...S},P)=>{let E="flex"===v||"flex-row-reverse"===v,I=!!(b||j||z),O=N&&!A?(0,r.jsx)(n.FormMessage,{className:(0,o.cn)("mt-2 transition-all duration-300 ease-in-out","flex-row-reverse"===v&&"mt-0"),"data-formlayout-id":"message"}):C&&!A?(0,r.jsx)("p",{className:(0,o.cn)("mt-2 text-sm text-destructive","flex-row-reverse"===v&&"mt-0"),children:C}):null,R=a&&N?(0,r.jsx)(n.FormDescription,{className:(0,o.cn)(c({size:_,layout:v})),"data-formlayout-id":"description",id:`${l}-description`,children:a}):a?(0,r.jsx)("p",{className:(0,o.cn)(c({size:_,layout:v}),"text-sm text-foreground-light"),"data-formlayout-id":"description",children:a}):null,F=()=>(0,r.jsxs)(r.Fragment,{children:[j&&(0,r.jsx)("span",{className:(0,o.cn)(f({size:_})),id:l+"-before","data-formlayout-id":"beforeLabel",children:(0,r.jsx)("span",{children:j})}),(0,r.jsx)("span",{children:b}),z&&(0,r.jsx)("span",{className:(0,o.cn)(p({size:_})),id:l+"-after","data-formlayout-id":"afterLabel",children:z})]});return(0,r.jsxs)("div",{ref:P,...S,className:(0,o.cn)(s({size:_,flex:E,align:e,layout:v}),t),children:[E&&(0,r.jsxs)("div",{className:(0,o.cn)(x({flex:E,align:e,layout:v})),children:[S.children,"flex-row-reverse"===v&&O]}),I||h||"horizontal"===v?(0,r.jsx)(r.Fragment,{children:(0,r.jsxs)("div",{className:(0,o.cn)(d({align:e,labelLayout:w,flex:E,layout:v})),"data-formlayout-id":"labelContainer",children:[I&&N?(0,r.jsx)(n.FormLabel,{className:"text-foreground flex gap-2 items-center wrap-break-word","data-formlayout-id":"formLabel",htmlFor:S.name||l,children:(0,r.jsx)(F,{})}):(0,r.jsx)(i.Label,{className:"text-foreground flex gap-2 items-center wrap-break-word leading-normal","data-formlayout-id":"label",htmlFor:S.name||l,children:(0,r.jsx)(F,{})}),h&&(0,r.jsx)("span",{className:(0,o.cn)(g({size:_})),id:l+"-optional","data-formlayout-id":"labelOptional",children:h}),E&&(0,r.jsxs)(r.Fragment,{children:[R,"flex-row-reverse"!==v&&O]})]})}):null,!E&&(0,r.jsx)("div",{className:(0,o.cn)(u({align:e,layout:v})),style:y,"data-formlayout-id":"dataContainer",children:(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("div",{className:(0,o.cn)(m({nonBoxInput:k,label:b,layout:v})),"data-formlayout-id":"nonBoxInputContainer",children:S.children}),O,R]})})]})});e.s(["FormLayout",0,b])},538482,e=>{"use strict";var r=e.i(221628),t=e.i(416340),a=e.i(20482),o=e.i(95053);let n=(0,t.forwardRef)(({...e},t)=>(0,r.jsx)(a.FormItem,{children:(0,r.jsx)(o.FormLayout,{ref:t,isReactForm:!0,...e,children:e.children})}));n.displayName="FormItemLayout",e.s(["FormItemLayout",0,n])},344580,e=>{"use strict";var r=e.i(67318),t=function(e,t,a){if(e&&"reportValidity"in e){var o=(0,r.get)(a,t);e.setCustomValidity(o&&o.message||""),e.reportValidity()}},a=function(e,r){var a=function(a){var o=r.fields[a];o&&o.ref&&"reportValidity"in o.ref?t(o.ref,a,e):o.refs&&o.refs.forEach(function(r){return t(r,a,e)})};for(var o in r.fields)a(o)},o=function(e,t){t.shouldUseNativeValidation&&a(e,t);var o={};for(var l in e){var s=(0,r.get)(t.fields,l),d=Object.assign(e[l]||{},{ref:s&&s.ref});if(i(t.names||Object.keys(e),l)){var u=Object.assign({},n((0,r.get)(o,l)));(0,r.set)(u,"root",d),(0,r.set)(o,l,u)}else(0,r.set)(o,l,d)}return o},n=function(e){return Array.isArray(e)?e.filter(Boolean):[]},i=function(e,r){return e.some(function(e){return e.startsWith(r+".")})},l=function(e,t){for(var a={};e.length;){var o=e[0],n=o.code,i=o.message,l=o.path.join(".");if(!a[l])if("unionErrors"in o){var s=o.unionErrors[0].errors[0];a[l]={message:s.message,type:s.code}}else a[l]={message:i,type:n};if("unionErrors"in o&&o.unionErrors.forEach(function(r){return r.errors.forEach(function(r){return e.push(r)})}),t){var d=a[l].types,u=d&&d[o.code];a[l]=(0,r.appendErrors)(l,t,a,n,u?[].concat(u,o.message):o.message)}e.shift()}return a};e.s(["zodResolver",0,function(e,r,t){return void 0===t&&(t={}),function(n,i,s){try{return Promise.resolve(function(o){try{var i=Promise.resolve(e["sync"===t.mode?"parse":"parseAsync"](n,r)).then(function(e){return s.shouldUseNativeValidation&&a({},s),{errors:{},values:t.raw?n:e}})}catch(e){return o(e)}return i&&i.then?i.then(void 0,o):i}(function(e){if(null!=e.errors)return{values:{},errors:o(l(e.errors,!s.shouldUseNativeValidation&&"all"===s.criteriaMode),s)};throw e}))}catch(e){return Promise.reject(e)}}}],344580)},793365,(e,r,t)=>{!function(a,o){if("function"==typeof define&&define.amd){let a;void 0!==(a=o(e.r,t,r))&&e.v(a)}else r.exports=o()}(e.e,function(){"use strict";Array.isArray||(Array.isArray=function(e){return"[object Array]"===Object.prototype.toString.call(e)});var e={},r={"==":function(e,r){return e==r},"===":function(e,r){return e===r},"!=":function(e,r){return e!=r},"!==":function(e,r){return e!==r},">":function(e,r){return e>r},">=":function(e,r){return e>=r},"<":function(e,r,t){return void 0===t?e<r:e<r&&r<t},"<=":function(e,r,t){return void 0===t?e<=r:e<=r&&r<=t},"!!":function(r){return e.truthy(r)},"!":function(r){return!e.truthy(r)},"%":function(e,r){return e%r},log:function(e){return console.log(e),e},in:function(e,r){return!!r&&void 0!==r.indexOf&&-1!==r.indexOf(e)},cat:function(){return Array.prototype.join.call(arguments,"")},substr:function(e,r,t){if(t<0){var a=String(e).substr(r);return a.substr(0,a.length+t)}return String(e).substr(r,t)},"+":function(){return Array.prototype.reduce.call(arguments,function(e,r){return parseFloat(e,10)+parseFloat(r,10)},0)},"*":function(){return Array.prototype.reduce.call(arguments,function(e,r){return parseFloat(e,10)*parseFloat(r,10)})},"-":function(e,r){return void 0===r?-e:e-r},"/":function(e,r){return e/r},min:function(){return Math.min.apply(this,arguments)},max:function(){return Math.max.apply(this,arguments)},merge:function(){return Array.prototype.reduce.call(arguments,function(e,r){return e.concat(r)},[])},var:function(e,r){var t=void 0===r?null:r,a=this;if(void 0===e||""===e||null===e)return a;for(var o=String(e).split("."),n=0;n<o.length;n++)if(null==a||void 0===(a=a[o[n]]))return t;return a},missing:function(){for(var r=[],t=Array.isArray(arguments[0])?arguments[0]:arguments,a=0;a<t.length;a++){var o=t[a],n=e.apply({var:o},this);(null===n||""===n)&&r.push(o)}return r},missing_some:function(r,t){var a=e.apply({missing:t},this);return t.length-a.length>=r?[]:a}};return e.is_logic=function(e){return"object"==typeof e&&null!==e&&!Array.isArray(e)&&1===Object.keys(e).length},e.truthy=function(e){return(!Array.isArray(e)||0!==e.length)&&!!e},e.get_operator=function(e){return Object.keys(e)[0]},e.get_values=function(r){return r[e.get_operator(r)]},e.apply=function(t,a){if(Array.isArray(t))return t.map(function(r){return e.apply(r,a)});if(!e.is_logic(t))return t;var o,n,i,l,s,d=e.get_operator(t),u=t[d];if(Array.isArray(u)||(u=[u]),"if"===d||"?:"==d){for(o=0;o<u.length-1;o+=2)if(e.truthy(e.apply(u[o],a)))return e.apply(u[o+1],a);return u.length===o+1?e.apply(u[o],a):null}if("and"===d){for(o=0;o<u.length&&(n=e.apply(u[o],a),e.truthy(n));o+=1);return n}if("or"===d){for(o=0;o<u.length&&(n=e.apply(u[o],a),!e.truthy(n));o+=1);return n}if("filter"===d)return(l=e.apply(u[0],a),i=u[1],Array.isArray(l))?l.filter(function(r){return e.truthy(e.apply(i,r))}):[];if("map"===d)return(l=e.apply(u[0],a),i=u[1],Array.isArray(l))?l.map(function(r){return e.apply(i,r)}):[];else if("reduce"===d)return(l=e.apply(u[0],a),i=u[1],s=void 0!==u[2]?u[2]:null,Array.isArray(l))?l.reduce(function(r,t){return e.apply(i,{current:t,accumulator:r})},s):s;else if("all"===d){if(l=e.apply(u[0],a),i=u[1],!Array.isArray(l)||!l.length)return!1;for(o=0;o<l.length;o+=1)if(!e.truthy(e.apply(i,l[o])))return!1;return!0}else if("none"===d){if(l=e.apply(u[0],a),i=u[1],!Array.isArray(l)||!l.length)return!0;for(o=0;o<l.length;o+=1)if(e.truthy(e.apply(i,l[o])))return!1;return!0}else if("some"===d){if(l=e.apply(u[0],a),i=u[1],!Array.isArray(l)||!l.length)return!1;for(o=0;o<l.length;o+=1)if(e.truthy(e.apply(i,l[o])))return!0;return!1}if(u=u.map(function(r){return e.apply(r,a)}),r.hasOwnProperty(d)&&"function"==typeof r[d])return r[d].apply(a,u);if(d.indexOf(".")>0){var c=String(d).split("."),f=r;for(o=0;o<c.length;o++){if(!f.hasOwnProperty(c[o]))throw Error("Unrecognized operation "+d+" (failed at "+c.slice(0,o+1).join(".")+")");f=f[c[o]]}return f.apply(a,u)}throw Error("Unrecognized operation "+d)},e.uses_data=function(r){var t=[];if(e.is_logic(r)){var a=e.get_operator(r),o=r[a];Array.isArray(o)||(o=[o]),"var"===a?t.push(o[0]):o.forEach(function(r){t.push.apply(t,e.uses_data(r))})}for(var n=[],i=0,l=t.length;i<l;i++)-1===n.indexOf(t[i])&&n.push(t[i]);return n},e.add_operation=function(e,t){r[e]=t},e.rm_operation=function(e){delete r[e]},e.rule_like=function(r,t){if(t===r||"@"===t)return!0;if("number"===t)return"number"==typeof r;if("string"===t)return"string"==typeof r;if("array"===t)return Array.isArray(r)&&!e.is_logic(r);if(e.is_logic(t)){if(e.is_logic(r)){var a=e.get_operator(t),o=e.get_operator(r);if("@"===a||a===o)return e.rule_like(e.get_values(r,!1),e.get_values(t,!1))}return!1}if(Array.isArray(t)&&Array.isArray(r)){if(t.length!==r.length)return!1;for(var n=0;n<t.length;n+=1)if(!e.rule_like(r[n],t[n]))return!1;return!0}return!1},e})},2579,e=>{"use strict";e.i(128328);var r=e.i(704206),t=e.i(158639),a=e.i(793365),o=e.i(416340),n=e.i(265735),i=e.i(635494),l=e.i(154985),s=e.i(10429);let d=e=>`^${e.replace(".","\\.").replace("%",".*")}$`;function u(e,r){return!e.filter(e=>e.restrictive).some(({condition:e})=>null===e||a.default.apply(e,r))&&e.filter(e=>!e.restrictive).some(({condition:e})=>null===e||a.default.apply(e,r))}function c(e,r,t,a,o,n){if(!e||!Array.isArray(e))return!1;if(n){let i=e.filter(e=>e.organization_slug===o&&e.actions.some(e=>r?r.match(d(e)):null)&&e.resources.some(e=>t.match(d(e)))&&e.project_refs?.includes(n));if(i.length>0)return u(i,{resource_name:t,...a})}return u(e.filter(e=>!e.project_refs||0===e.project_refs.length).filter(e=>e.organization_slug===o&&e.actions.some(e=>r?r.match(d(e)):null)&&e.resources.some(e=>t.match(d(e)))),{resource_name:t,...a})}function f(e,r,a,o=!0){let{data:s,isPending:d,isSuccess:u}=(0,l.usePermissionsQuery)({enabled:void 0===e&&o}),c=void 0===r&&o,{data:p,isPending:g,isSuccess:x}=(0,n.useSelectedOrganizationQuery)({enabled:c}),m=(void 0===r?p:{slug:r})?.slug,{ref:b}=(0,t.useParams)(),h=!!b&&void 0===a&&o,{data:v,isPending:y,isSuccess:w}=(0,i.useSelectedProjectQuery)({enabled:h}),_=void 0===a||v?.parent_project_ref?v:{ref:a,parent_project_ref:void 0},j=_?.parent_project_ref?_.parent_project_ref:_?.ref;return{permissions:void 0===e?s:e,organizationSlug:m,projectRef:j,isLoading:d||c&&g||h&&y,isSuccess:u&&(!c||x)&&(!h||w)}}e.s(["doPermissionsCheck",0,c,"useAsyncCheckPermissions",0,function(e,t,a,n){let i=(0,r.useIsLoggedIn)(),{organizationSlug:l,projectRef:d,permissions:u}=n??{},{permissions:p,organizationSlug:g,projectRef:x,isLoading:m,isSuccess:b}=f(u,l,d,i),h=(0,o.useMemo)(()=>!s.IS_PLATFORM||!!i&&!!b&&!!p&&c(p,e,t,a,g,x),[i,b,p,e,t,a,g,x]);return{isLoading:!!s.IS_PLATFORM&&(!i||m),isSuccess:!s.IS_PLATFORM||!!i&&b,can:h}},"useGetPermissions",0,function(e,r,t=!0){return f(e,r,void 0,t)}])},215312,e=>{"use strict";var r=e.i(221628),t=e.i(416340),a=e.i(837710),o=e.i(843778),n=e.i(613580);let i=(0,t.forwardRef)(({tooltip:e,className:t,...i},l)=>(0,r.jsxs)(n.Tooltip,{children:[(0,r.jsx)(n.TooltipTrigger,{asChild:!0,children:(0,r.jsx)(a.Button,{ref:l,...i,className:(0,o.cn)(t,"pointer-events-auto"),children:i.children})}),void 0!==e.content.text&&(0,r.jsx)(n.TooltipContent,{...e.content,children:e.content.text})]}));i.displayName="ButtonTooltip",e.s(["ButtonTooltip",0,i])},938933,e=>{"use strict";var r=e.i(416340);let t={bg:{brand:{primary:"bg-purple-600",secondary:"bg-purple-200"}},text:{brand:"text-purple-600",body:"text-foreground-light",title:"text-foreground"},border:{brand:"border-brand-600",primary:"border-default",secondary:"border-secondary",alternative:"border-alternative"},placeholder:"placeholder-foreground-muted",focus:`
    outline-hidden
    focus:ring-current focus:ring-2
  `,"focus-visible":`
    outline-hidden
    transition-all
    outline-0
    focus-visible:outline-4
    focus-visible:outline-offset-1
  `,size:{text:{tiny:"text-xs",small:"text-base md:text-sm leading-4",medium:"text-base md:text-sm",large:"text-base",xlarge:"text-base"},padding:{tiny:"px-2.5 py-1",small:"px-3 py-2",medium:"px-4 py-2",large:"px-4 py-2",xlarge:"px-6 py-3"}},overlay:{base:"absolute inset-0 bg-background opacity-50",container:"fixed inset-0 transition-opacity"}},a={tiny:`${t.size.text.tiny} ${t.size.padding.tiny}`,small:`${t.size.text.small} ${t.size.padding.small}`,medium:`${t.size.text.medium} ${t.size.padding.medium}`,large:`${t.size.text.large} ${t.size.padding.large}`,xlarge:`${t.size.text.xlarge} ${t.size.padding.xlarge}`},o={card:{base:`
      bg-surface-100

      border
      ${t.border.primary}

      flex flex-col
      rounded-md shadow-lg overflow-hidden relative
    `,hoverable:"transition hover:-translate-y-1 hover:shadow-2xl",head:`px-8 py-6 flex justify-between
    border-b
      ${t.border.primary} `,content:"p-8"},tabs:{base:"w-full justify-between space-y-4",underlined:{list:`
        flex items-center border-b
        ${t.border.secondary}
        `,base:`
        relative
        cursor-pointer
        text-foreground-lighter
        flex
        items-center
        space-x-2
        text-center
        transition
        focus:outline-hidden
        focus-visible:ring-3
        focus-visible:ring-foreground-muted
        focus-visible:border-foreground-muted
      `,inactive:`
        hover:text-foreground
      `,active:`
        !text-foreground
        border-b-2 border-foreground
      `},pills:{list:"flex space-x-1",base:`
        relative
        cursor-pointer
        flex
        items-center
        space-x-2
        text-center
        transition
        shadow-xs
        rounded-sm
        border
        focus:outline-hidden
        focus-visible:ring-3
        focus-visible:ring-foreground-muted
        focus-visible:border-foreground-muted
        `,inactive:`
        bg-background
        border-strong hover:border-foreground-muted
        text-foreground-muted hover:text-foreground
      `,active:`
        bg-selection
        text-foreground
        border-stronger
      `},"rounded-pills":{list:"flex flex-wrap gap-2",base:`
        relative
        cursor-pointer
        flex
        items-center
        space-x-2
        text-center
        transition
        shadow-xs
        rounded-full
        focus:outline-hidden
        focus-visible:ring-3
        focus-visible:ring-foreground-muted
        focus-visible:border-foreground-muted
        `,inactive:`
        bg-surface-200 hover:bg-surface-300
        hover:border-foreground-lighter
        text-foreground-lighter hover:text-foreground
      `,active:`
        bg-foreground
        text-background
        border-foreground
      `},block:"w-full flex items-center justify-center",size:{...a},scrollable:"overflow-auto whitespace-nowrap no-scrollbar mask-fadeout-right",wrappable:"flex-wrap",content:"focus:outline-hidden transition-height"},input:{base:`
      block
      box-border
      w-full
      rounded-md
      shadow-xs
      transition-all
      text-foreground
      border
      focus-visible:shadow-md
      ${t.focus}
      focus-visible:border-foreground-muted
      focus-visible:ring-background-control
      ${t.placeholder}
      group
    `,variants:{standard:`
        bg-foreground/[.026]
        border border-control
        `,error:`
        bg-destructive-200
        border border-destructive-500
        focus:ring-destructive-400
        placeholder:text-destructive-400
       `},container:"relative",with_icon:{tiny:"pl-7",small:"pl-8",medium:"pl-8",large:"pl-10",xlarge:"pl-11"},size:{...a},disabled:"opacity-50",actions_container:"absolute inset-y-0 right-0 pl-3 pr-1 flex space-x-1 items-center",textarea_actions_container:"absolute inset-y-1.5 right-0 pl-3 pr-1 flex space-x-1 items-start",textarea_actions_container_items:"flex items-center"},sidepanel:{base:`
      z-50
      bg-dash-sidebar
      flex flex-col
      fixed
      inset-y-0
      h-full lg:h-screen
      border-l
      shadow-xl
    `,header:`
      flex items-center
      space-y-1 py-4 px-4 bg-dash-sidebar sm:px-6
      border-b h-(--header-height)
    `,contents:`
      relative
      flex-1
      overflow-y-auto
    `,content:`
      px-4 sm:px-6
    `,footer:`
      flex justify-end gap-2
      p-4 bg-overlay
      border-t
    `,size:{medium:"w-screen max-w-md h-full",large:"w-screen max-w-2xl h-full",xlarge:"w-screen max-w-3xl h-full",xxlarge:"w-screen max-w-4xl h-full",xxxlarge:"w-screen max-w-5xl h-full",xxxxlarge:"w-screen max-w-6xl h-full"},align:{left:`
        left-0
        data-open:animate-panel-slide-left-out
        data-closed:animate-panel-slide-left-in
      `,right:`
        right-0
        data-open:animate-panel-slide-right-out
        data-closed:animate-panel-slide-right-in
      `},separator:`
      w-full
      h-px
      my-2
      bg-border
    `,overlay:`
      z-50
      fixed
      bg-alternative
      h-full w-full
      left-0
      top-0
      opacity-75
      data-closed:animate-fade-out-overlay-bg
      data-open:animate-fade-in-overlay-bg
    `,trigger:`
      border-none bg-transparent p-0 focus:ring-0
    `},form_layout:{container:"grid gap-2",flex:{left:{base:"flex flex-row gap-6",content:"",labels:"order-2",data_input:"order-1"},right:{base:"flex flex-row gap-6 justify-between",content:"order-last",labels:"",data_input:"text-right"}},responsive:"md:grid md:grid-cols-12",non_responsive:"grid grid-cols-12 gap-2",labels_horizontal_layout:"flex flex-row space-x-2 justify-between col-span-12",labels_vertical_layout:"flex flex-col space-y-2 col-span-4",data_input_horizontal_layout:"col-span-12",non_box_data_input_spacing_vertical:"my-3",non_box_data_input_spacing_horizontal:"my-3 md:mt-0 mb-3",data_input_vertical_layout:"col-span-8",data_input_vertical_layout__align_right:"text-right",label:{base:"block text-foreground-light",size:{...t.size.text}},label_optional:{base:"text-foreground-lighter",size:{...t.size.text}},description:{base:"mt-2 text-foreground-lighter leading-normal",size:{...t.size.text}},label_before:{base:"text-foreground-lighter ",size:{...t.size.text}},label_after:{base:"text-foreground-lighter",size:{...t.size.text}},error:{base:`
        text-red-900
        transition-all
        data-show:mt-2
        data-show:animate-slide-down-normal
        data-hide:animate-slide-up-normal
      `,size:{...t.size.text}},size:{tiny:"text-xs",small:"text-base md:text-sm leading-4",medium:"text-base md:text-sm",large:"text-base",xlarge:"text-base"}},menu:{item:{base:`
        cursor-pointer
        flex space-x-3 items-center
        outline-hidden
        focus-visible:ring-1 ring-foreground-muted focus-visible:z-10
        group
      `,content:{base:"transition truncate text-sm w-full",normal:"text-foreground-light group-hover:text-foreground",active:"text-foreground font-semibold"},icon:{base:"transition truncate text-sm",normal:"text-foreground-lighter group-hover:text-foreground-light",active:"text-foreground"},variants:{text:{base:`
            py-1
          `,normal:`
            font-normal
            border-default
            group-hover:border-foreground-muted`,active:`
            font-semibold
            text-foreground-muted
            z-10
          `},border:{base:`
            px-4 py-1
          `,normal:`
            border-l
            font-normal
            border-default
            group-hover:border-foreground-muted`,active:`
            font-semibold

            text-foreground-muted
            z-10

            border-l
            border-brand
            group-hover:border-brand
          `,rounded:"rounded-md"},pills:{base:"my-px px-3 py-[3px] rounded-md transition-colors active:bg-sidebar-accent/50",normal:`
            font-normal
            border-default
            hover:bg-sidebar-accent/50
            group-hover:border-foreground-muted`,active:`
            font-semibold
            bg-sidebar-accent
            text-foreground-lighter
            z-10 rounded-md
          `}}},group:{base:`
        flex space-x-3
        mb-2
        font-normal
      `,icon:"text-foreground-lighter",content:"text-sm text-foreground-lighter w-full",variants:{text:"",pills:"px-3",border:""}}},modal:{base:`
      relative
      bg-dash-sidebar
      my-4 max-w-screen
      border border-overlay
      rounded-md
      shadow-xl
      data-open:animate-overlay-show
      data-closed:animate-overlay-hide

    `,header:`
      bg-surface-200
      space-y-1 py-3 px-4 sm:px-5
      border-b border-overlay
      flex items-center justify-between
    `,footer:`
      flex justify-end gap-2
      py-3 px-5
      border-t border-overlay
    `,size:{tiny:"sm:align-middle sm:w-full sm:max-w-xs",small:"sm:align-middle sm:w-full sm:max-w-sm",medium:"sm:align-middle sm:w-full sm:max-w-lg",large:"sm:align-middle sm:w-full md:max-w-xl",xlarge:"sm:align-middle sm:w-full md:max-w-3xl",xxlarge:"sm:align-middle sm:w-full max-w-screen md:max-w-6xl",xxxlarge:"sm:align-middle sm:w-full md:max-w-7xl"},overlay:`
      z-40
      fixed
      bg-alternative
      h-full w-full
      left-0
      top-0
      opacity-75
      data-closed:animate-fade-out-overlay-bg
      data-open:animate-fade-in-overlay-bg
    `,scroll_overlay:`
      z-40
      fixed
      inset-0
      grid
      place-items-center
      overflow-y-auto
      data-open:animate-overlay-show data-closed:animate-overlay-hide
    `,separator:`
      w-full
      h-px
      my-2
      bg-border-overlay
    `,content:"px-5"},listbox:{base:`
      block
      box-border
      w-full
      rounded-md
      shadow-xs
      text-foreground
      border
      focus-visible:shadow-md
      ${t.focus}
      focus-visible:border-foreground-muted
      focus-visible:ring-background-control
      ${t.placeholder}
      indent-px
      transition-all
      bg-none
    `,container:"relative",label:"truncate",variants:{standard:`
        bg-control
        border border-control

        aria-expanded:border-foreground-muted
        aria-expanded:ring-border-muted
        aria-expanded:ring-2
        `,error:`
        bg-destructive-200
        border border-destructive-500
        focus:ring-destructive-400
        placeholder:text-destructive-400
       `},options_container_animate:`
      transition
      data-open:animate-slide-down
      data-open:opacity-1
      data-closed:animate-slide-up
      data-closed:opacity-0
    `,options_container:`
      bg-overlay
      shadow-lg
      border border-solid
      border-overlay max-h-60
      rounded-md py-1 text-base
      sm:text-sm z-10 overflow-hidden overflow-y-scroll

      origin-dropdown
      data-open:animate-dropdown-content-show
      data-closed:animate-dropdown-content-hide
    `,with_icon:"pl-2",addOnBefore:`
      w-full flex flex-row items-center space-x-3
    `,size:{...a},disabled:"opacity-50",actions_container:"absolute inset-y-0 right-0 pl-3 pr-1 flex space-x-1 items-center",chevron_container:"absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none",chevron:"h-5 w-5 text-foreground-muted",option:`
      w-listbox
      transition cursor-pointer select-none relative py-2 pl-3 pr-9
      text-foreground-light
      text-sm
      hover:bg-border-overlay
      focus:bg-border-overlay
      focus:text-foreground
      border-none
      focus:outline-hidden
    `,option_active:"text-foreground bg-selection",option_disabled:"cursor-not-allowed opacity-60",option_inner:"flex items-center space-x-3",option_check:"absolute inset-y-0 right-0 flex items-center pr-3 text-brand",option_check_active:"text-brand",option_check_icon:"h-5 w-5"},inputErrorIcon:{base:`
      flex items-center
      right-3 pr-2 pl-2
      inset-y-0
      pointer-events-none
      text-red-900
    `},inputIconContainer:{base:`
    absolute inset-y-0
    left-0 pl-2 flex
    items-center pointer-events-none
    text-foreground-light
    [&_svg]:stroke-[1.5]
    `,size:{tiny:"[&_svg]:h-[14px] [&_svg]:w-[14px]",small:"[&_svg]:h-[18px] [&_svg]:w-[18px]",medium:"[&_svg]:h-[20px] [&_svg]:w-[20px]",large:"[&_svg]:h-[20px] [&_svg]:w-[20px] pl-3",xlarge:"[&_svg]:h-[24px] [&_svg]:w-[24px] pl-3",xxlarge:"[&_svg]:h-[30px] [&_svg]:w-[30px] pl-3",xxxlarge:"[&_svg]:h-[42px] [&_svg]:w-[42px] pl-3"}},icon:{container:"shrink-0 flex items-center justify-center rounded-full p-3"},loading:{base:"relative",content:{base:"transition-opacity duration-300",active:"opacity-40"},spinner:`
      absolute
      text-foreground-lighter animate-spin
      inset-0
      size-5
      m-auto
    `}},n=(0,r.createContext)({theme:o});e.s(["default",0,function(e){let{theme:{[e]:t}}=(0,r.useContext)(n);return JSON.parse(t=JSON.stringify(t).replace(/\\n/g,"").replace(/\s\s+/g," "))}],938933)},202003,e=>{"use strict";e.s(["buildStudioPageTitle",0,e=>{let r=[e.entity,e.section,e.surface,e.project,e.org,e.brand],t=[];return r.forEach(e=>{let r=(e=>{if(void 0===e)return;let r=e.trim().replace(/\s+/g," ");if(0!==r.length)return r.length<=60?r:`${r.slice(0,59).trimEnd()}…`})(e);if(!r)return;let a=t[t.length-1];(void 0===a||a.toLowerCase()!==r.toLowerCase())&&t.push(r)}),t.join(" | ")}])},22194,e=>{"use strict";var r=e.i(221628);e.i(481541);var t=e.i(665265),t=t,a=e.i(188139),o=e.i(416340),n=e.i(843778);e.s(["ProfileImage",0,({alt:e,src:i,placeholder:l,className:s})=>{let[d,u]=(0,o.useState)(!1);return i&&!d?(0,r.jsx)(a.default,{alt:e??"",src:i,width:"24",height:"24",className:(0,n.cn)("aspect-square bg-foreground rounded-full object-cover",s),onError:()=>u(!0)}):l??(0,r.jsx)("figure",{className:(0,n.cn)("bg-foreground rounded-full flex items-center justify-center",s),children:(0,r.jsx)(t.default,{size:18,strokeWidth:1.5,className:"text-background"})})}],22194)},237002,e=>{"use strict";var r=e.i(221628),t=e.i(416340),a=e.i(78892),o=e.i(608652),n=e.i(174617),i=e.i(199786),l=e.i(300792),s=e.i(692166),d=e.i(169525),u=e.i(600317),c="Checkbox",[f,p]=(0,o.createContextScope)(c),[g,x]=f(c);function m(e){let{__scopeCheckbox:a,checked:o,children:n,defaultChecked:l,disabled:s,form:d,name:u,onCheckedChange:f,required:p,value:x="on",internal_do_not_use_render:m}=e,[b,h]=(0,i.useControllableState)({prop:o,defaultProp:l??!1,onChange:f,caller:c}),[v,y]=t.useState(null),[w,_]=t.useState(null),j=t.useRef(!1),k=!v||!!d||!!v.closest("form"),A={checked:b,disabled:s,setChecked:h,control:v,setControl:y,name:u,form:d,value:x,hasConsumerStoppedPropagationRef:j,required:p,defaultChecked:!z(l)&&l,isFormControl:k,bubbleInput:w,setBubbleInput:_};return(0,r.jsx)(g,{scope:a,...A,children:"function"==typeof m?m(A):n})}var b="CheckboxTrigger",h=t.forwardRef(({__scopeCheckbox:e,onKeyDown:o,onClick:i,...l},s)=>{let{control:d,value:c,disabled:f,checked:p,required:g,setControl:m,setChecked:h,hasConsumerStoppedPropagationRef:v,isFormControl:y,bubbleInput:w}=x(b,e),_=(0,a.useComposedRefs)(s,m),j=t.useRef(p);return t.useEffect(()=>{let e=d?.form;if(e){let r=()=>h(j.current);return e.addEventListener("reset",r),()=>e.removeEventListener("reset",r)}},[d,h]),(0,r.jsx)(u.Primitive.button,{type:"button",role:"checkbox","aria-checked":z(p)?"mixed":p,"aria-required":g,"data-state":k(p),"data-disabled":f?"":void 0,disabled:f,value:c,...l,ref:_,onKeyDown:(0,n.composeEventHandlers)(o,e=>{"Enter"===e.key&&e.preventDefault()}),onClick:(0,n.composeEventHandlers)(i,e=>{h(e=>!!z(e)||!e),w&&y&&(v.current=e.isPropagationStopped(),v.current||e.stopPropagation())})})});h.displayName=b;var v=t.forwardRef((e,t)=>{let{__scopeCheckbox:a,name:o,checked:n,defaultChecked:i,required:l,disabled:s,value:d,onCheckedChange:u,form:c,...f}=e;return(0,r.jsx)(m,{__scopeCheckbox:a,checked:n,defaultChecked:i,disabled:s,required:l,onCheckedChange:u,name:o,form:c,value:d,internal_do_not_use_render:({isFormControl:e})=>(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(h,{...f,ref:t,__scopeCheckbox:a}),e&&(0,r.jsx)(j,{__scopeCheckbox:a})]})})});v.displayName=c;var y="CheckboxIndicator",w=t.forwardRef((e,t)=>{let{__scopeCheckbox:a,forceMount:o,...n}=e,i=x(y,a);return(0,r.jsx)(d.Presence,{present:o||z(i.checked)||!0===i.checked,children:(0,r.jsx)(u.Primitive.span,{"data-state":k(i.checked),"data-disabled":i.disabled?"":void 0,...n,ref:t,style:{pointerEvents:"none",...e.style}})})});w.displayName=y;var _="CheckboxBubbleInput",j=t.forwardRef(({__scopeCheckbox:e,...o},n)=>{let{control:i,hasConsumerStoppedPropagationRef:d,checked:c,defaultChecked:f,required:p,disabled:g,name:m,value:b,form:h,bubbleInput:v,setBubbleInput:y}=x(_,e),w=(0,a.useComposedRefs)(n,y),j=(0,l.usePrevious)(c),k=(0,s.useSize)(i);t.useEffect(()=>{if(!v)return;let e=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"checked").set,r=!d.current;if(j!==c&&e){let t=new Event("click",{bubbles:r});v.indeterminate=z(c),e.call(v,!z(c)&&c),v.dispatchEvent(t)}},[v,j,c,d]);let A=t.useRef(!z(c)&&c);return(0,r.jsx)(u.Primitive.input,{type:"checkbox","aria-hidden":!0,defaultChecked:f??A.current,required:p,disabled:g,name:m,value:b,form:h,...o,tabIndex:-1,ref:w,style:{...o.style,...k,position:"absolute",pointerEvents:"none",opacity:0,margin:0,transform:"translateX(-100%)"}})});function z(e){return"indeterminate"===e}function k(e){return z(e)?"indeterminate":e?"checked":"unchecked"}j.displayName=_,e.s(["Checkbox",0,v,"CheckboxIndicator",0,w,"Indicator",0,w,"Root",0,v,"createCheckboxScope",0,p,"unstable_BubbleInput",0,j,"unstable_CheckboxBubbleInput",0,j,"unstable_CheckboxProvider",0,m,"unstable_CheckboxTrigger",0,h,"unstable_Provider",0,m,"unstable_Trigger",0,h],836157);var A=e.i(836157),A=A,N=e.i(312062),C=e.i(843778);let S=t.forwardRef(({className:e,...t},a)=>(0,r.jsx)(A.Root,{ref:a,className:(0,C.cn)("peer flex items-center justify-center h-4 w-4 shrink-0 rounded-sm border border-control bg-control/25 ring-offset-background","transition-colors duration-150 ease-in-out","hover:border-strong","focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2","disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-foreground data-[state=checked]:text-background",e),...t,children:(0,r.jsx)(A.Indicator,{className:(0,C.cn)("flex items-center justify-center text-current"),children:(0,r.jsx)(N.Check,{className:"h-3 w-3 text-background",strokeWidth:4})})}));S.displayName=A.Root.displayName,e.s(["Checkbox",0,S],237002)}]);

//# debugId=2d3bdcef-61d2-30f3-88da-d74719e5369e
//# sourceMappingURL=0-vsz44-pirwh.js.map