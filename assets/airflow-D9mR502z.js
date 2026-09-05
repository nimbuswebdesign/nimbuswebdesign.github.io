function _(r,n){var e=Math.imul(r,668265261)^Math.imul(n,374761393);return e=Math.imul(e^e>>>15,739982445),e=Math.imul(e^e>>>12,695872825),((e^e>>>15)>>>0)/4294967296}function he(r){return r*r*(3-2*r)}var S=6;function N(r,n,e){var x=Math.floor(r),i=Math.floor(n),s=r-x,c=n-i,l=(x%e+e)%e,m=(l+1)%e,p=(i%e+e)%e,E=(p+1)%e,v=_(l,p),g=_(m,p),f=_(l,E),D=_(m,E),T=he(s),h=he(c);return v+(g-v)*T+(f-v)*h+(v-g-f+D)*T*h}function xe(r,n){return N(r,n,S)*.5163+N(r*2,n*2,S*2)*.2581+N(r*4,n*4,S*4)*.129+N(r*8,n*8,S*8)*.0645+N(r*16,n*16,S*16)*.0321}function be(r){const n=[[.15,.12],[.53,.18],[.88,.3],[.72,.42],[.28,.52],[.68,.7],[.02,.85],[.9,.97],[.99,.56]],e=[];n.forEach(([i,s],c)=>{for(let l=0;l<8;l++){const m=_(c,l)*Math.PI*2,p=l===0?0:.07*Math.sqrt(_(l+20,c));e.push({x:i+Math.cos(m)*p,y:s+Math.sin(m)*p,r:.047+_(c+40,l)*.047,strength:.64+_(l,c+80)*.3})}});const x=new Float32Array(r*r*4);for(let i=0;i<r;i++)for(let s=0;s<r;s++){const c=(s+.5)/r,l=(i+.5)/r;let m=0;for(const E of e){let v=c-E.x,g=l-E.y;v-=Math.round(v),g-=Math.round(g);const f=(v*v+g*g)/(E.r*E.r);f<5&&(m=Math.max(m,Math.exp(-f*1.25)*E.strength))}const p=xe(c*S*4,l*S*4);x[(i*r+s)*4]=Math.max(0,m-(p-.28)*.16)}return x}const pe=`
uniform vec4 gustGeometry[5];
uniform vec4 gustMotion[5];
uniform int gustCount;
uniform float dt;
vec2 velocity(vec2 p) {
  vec2 wind = vec2(0.);
  for(int i=0;i<5;i++) {
    if(i>=gustCount) break;
    vec4 g=gustGeometry[i], m=gustMotion[i];
    vec2 delta=p-g.xy; delta-=round(delta);
    float a=dot(delta,m.xy), b=dot(delta,vec2(-m.y,m.x));
    float radius=g.z*(1.+g.w*.2), r2=radius*radius;
    float q=a*a/(r2*2.25)+b*b/r2;
    if(q>12.) continue;
    float strength=m.z*exp(-g.w*1.5-q);
    float along=strength*(1.-2.*b*b/r2), across=strength*2.*a*b/(r2*2.25);
    wind+=m.xy*along+vec2(-m.y,m.x)*across;
  }
  return wind;
}
vec2 departure(vec2 p) {return p-dt*velocity(p-dt*.5*velocity(p));}
`,Te=`#version 300 es
precision highp float;
in vec2 uv;out vec4 result;
uniform sampler2D source;
${pe}
void main(){result=texture(source,departure(uv));}
`,Re=`#version 300 es
precision highp float;
in vec2 uv;out vec4 result;
uniform sampler2D source;
uniform sampler2D forwardField;
uniform sampler2D backwardField;
uniform float size;
${pe}
void main(){
  vec2 back=departure(uv), corner=(floor(back*size-.5)+.5)/size;
  vec2 cell=vec2(1./size,0.);
  vec3 a=texture(source,corner).rgb,b=texture(source,corner+cell).rgb;
  vec3 c=texture(source,corner+cell.yx).rgb,d=texture(source,corner+cell.xx).rgb;
  vec3 corrected=texture(forwardField,uv).rgb+.5*(texture(source,uv).rgb-texture(backwardField,uv).rgb);
  // A donor-cell limiter prevents overshoot and negative cloud density.
  corrected=clamp(corrected,min(min(a,b),min(c,d)),max(max(a,b),max(c,d)));
  corrected.gb+=(uv-back)*corrected.r;
  result=vec4(corrected,0.);
}
`;function Me(r=32){const n=new Uint8Array(r*r*r),e=(i,s,c)=>{let l=Math.imul(i,73856093)^Math.imul(s,19349663)^Math.imul(c,83492791);return l=Math.imul(l^l>>>13,1274126177),((l^l>>>16)>>>0)/4294967295};function x(i,s,c,l){const m=Math.floor(i),p=Math.floor(s),E=Math.floor(c),v=h=>h*h*(3-2*h),g=v(i-m),f=v(s-p),D=v(c-E);let T=0;for(let h=0;h<2;h++)for(let R=0;R<2;R++)for(let b=0;b<2;b++)T+=e((m+b)%l,(p+R)%l,(E+h)%l)*(b?g:1-g)*(R?f:1-f)*(h?D:1-D);return T}for(let i=0;i<r;i++)for(let s=0;s<r;s++)for(let c=0;c<r;c++)n[(i*r+s)*r+c]=Math.round(255*(x(c*4/r,s*4/r,i*4/r,4)*.62+x(c*8/r,s*8/r,i*8/r,8)*.28+x(c*16/r,s*16/r,i*16/r,16)*.1));return n}const ye=`#version 300 es
precision highp float;
precision highp sampler3D;
in vec2 uv;
out vec4 result;
uniform sampler2D cloud;
uniform sampler3D detail;
uniform vec2 view;
uniform int steps;

float materialDensity(float base, vec2 material, float altitude) {
  if (base < .07 || abs(altitude) > .13) return 0.;
  float n = texture(detail, vec3(material * 7., altitude * 10. + .5)).r;
  float small = texture(detail, vec3(material * 21. + .37, altitude * 30.)).r;
  float z = altitude / .095;
  // Rounded billows, porous rims and progressively thinner torn wisps.
  return max(0., base * 2.1 - z * z - .14 - n * .85 - small * .2) * 1.8;
}
float density(vec3 p) {
  vec3 parcel = texture(cloud, p.xy).rgb;
  return materialDensity(parcel.r, p.xy - parcel.gb / max(parcel.r, .001), p.z);
}

void main() {
  vec2 p = vec2(uv.x, 1. - uv.y) * view;
  vec3 parcel = texture(cloud, p).rgb;
  if (parcel.r < .07) {result=vec4(0.);return;}
  vec2 material=p-parcel.gb/max(parcel.r,.001);
  vec3 sun = normalize(vec3(-.65, -.5, .8));
  float transmittance = 1.;
  vec3 radiance = vec3(0.);
  float dz = .26 / float(steps);
  // Static subpixel jitter breaks slice bands without temporal shimmer.
  float jitter = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715))));
  for (int i = 0; i < 40; i++) {
    if (i >= steps || transmittance < .015) break;
    vec3 samplePoint = vec3(p, .13 - (float(i) + jitter) * dz);
    float den = materialDensity(parcel.r, material, samplePoint.z);
    if (den < .001) continue;
    float opticalDepth = 0.;
    for (int j = 1; j <= 4; j++) {
      opticalDepth += density(samplePoint + sun * float(j) * .021) * .021;
    }
    float direct = exp(-opticalDepth * 29.);
    float ambient = .62 + .2 * (samplePoint.z / .13 * .5 + .5);
    vec3 lighting = vec3(.69, .79, .94) * ambient + vec3(1., .965, .89) * (.43 * direct);
    float absorbed = 1. - exp(-den * dz * 75.);
    radiance += transmittance * absorbed * lighting;
    transmittance *= 1. - absorbed;
  }
  float alpha = 1. - transmittance;
  result = vec4(radiance / max(alpha, .0001), alpha);
}
`;function we(r,n){const e=r.getContext("webgl2",{alpha:!0,antialias:!1,depth:!1,premultipliedAlpha:!1});if(!e||!e.getExtension("EXT_color_buffer_float"))return r.dataset.cloudState="fallback",()=>{};const x=matchMedia("(pointer: coarse)").matches,i=matchMedia("(prefers-reduced-motion: reduce)"),s=new URLSearchParams(location.search).has("cloud-debug"),c=x?256:384,l=[],m=[],p=[],E=[],v=`#version 300 es
    out vec2 uv;
    void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0,1);}`;function g(t){const a=e.createProgram();l.push(a);for(const[o,u]of[[e.VERTEX_SHADER,v],[e.FRAGMENT_SHADER,t]]){const d=e.createShader(o);if(e.shaderSource(d,u),e.compileShader(d),!e.getShaderParameter(d,e.COMPILE_STATUS)){const y=e.getShaderInfoLog(d);throw e.deleteShader(d),Error(y)}e.attachShader(a,d),e.deleteShader(d)}if(e.linkProgram(a),!e.getProgramParameter(a,e.LINK_STATUS))throw Error(e.getProgramInfoLog(a));return{id:a,uniforms:new Map}}function f(t,a){return t.uniforms.has(a)||t.uniforms.set(a,e.getUniformLocation(t.id,a)),t.uniforms.get(a)}function D(){l.forEach(t=>e.deleteProgram(t)),m.forEach(t=>e.deleteTexture(t)),p.forEach(t=>e.deleteFramebuffer(t)),E.forEach(t=>e.deleteVertexArray(t))}function T(t=null){const a=e.createTexture();m.push(a),e.bindTexture(e.TEXTURE_2D,a),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.REPEAT),e.texImage2D(e.TEXTURE_2D,0,e.RGBA16F,c,c,0,e.RGBA,e.FLOAT,t);const o=e.createFramebuffer();if(p.push(o),e.bindFramebuffer(e.FRAMEBUFFER,o),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,a,0),e.checkFramebufferStatus(e.FRAMEBUFFER)!==e.FRAMEBUFFER_COMPLETE)throw Error("Cloud target unavailable");return{texture:a,framebuffer:o}}let h,R,b,U,k,C,J,G;try{h=g(Te),R=g(Re),b=g(ye);const t=e.createVertexArray();E.push(t),e.bindVertexArray(t),U=T(be(c)),k=T(),C=T(),J=T(),G=e.createTexture(),m.push(G),e.bindTexture(e.TEXTURE_3D,G),e.texParameteri(e.TEXTURE_3D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_3D,e.TEXTURE_MAG_FILTER,e.LINEAR);for(const a of[e.TEXTURE_WRAP_S,e.TEXTURE_WRAP_T,e.TEXTURE_WRAP_R])e.texParameteri(e.TEXTURE_3D,a,e.REPEAT);e.texImage3D(e.TEXTURE_3D,0,e.R8,32,32,32,0,e.RED,e.UNSIGNED_BYTE,Me()),e.useProgram(b.id),e.uniform1i(f(b,"steps"),x?24:32)}catch(t){return console.warn("Cloud field fallback:",t),D(),r.dataset.cloudState="fallback",()=>{}}const M=[],ee=new Float32Array(20),te=new Float32Array(20);let w=null,B=[1,1],F=0,A=0,re=0,O=!0,j=!1,P=0,$=0,q=0,V=0;function X(t,a,o,u,d=e.TEXTURE_2D){e.activeTexture(e.TEXTURE0+u),e.bindTexture(d,o),e.uniform1i(f(t,a),u)}function ae(){e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,r.width,r.height),e.useProgram(b.id),X(b,"cloud",U.texture,0),X(b,"detail",G,1,e.TEXTURE_3D),e.uniform2fv(f(b,"view"),B),e.drawArrays(e.TRIANGLES,0,3)}function K(t,a,o,u){e.bindFramebuffer(e.FRAMEBUFFER,a.framebuffer),e.viewport(0,0,c,c),e.useProgram(t.id),X(t,"source",o.texture,0),e.uniform1f(f(t,"dt"),u),e.uniform1i(f(t,"gustCount"),M.length),e.uniform4fv(f(t,"gustGeometry[0]"),ee),e.uniform4fv(f(t,"gustMotion[0]"),te)}function Ee(t){for(let o=M.length-1;o>=0;o--){const u=M[o];if(u.age+=t,u.age>6){M.splice(o,1);continue}const d=u.speed*t*Math.exp(-u.age*1.5)*.65;u.x+=u.dx*d,u.y+=u.dy*d}M.forEach((o,u)=>{ee.set([o.x,o.y,o.radius,o.age],u*4),te.set([o.dx,o.dy,o.speed,0],u*4)});const a=Math.max(1,Math.ceil(t/.025));for(let o=0;o<a;o++){const u=t/a;K(h,C,U,u),e.drawArrays(e.TRIANGLES,0,3),K(h,J,C,-u),e.drawArrays(e.TRIANGLES,0,3),K(R,k,U,u),X(R,"forwardField",C.texture,1),X(R,"backwardField",J.texture,2),e.uniform1f(f(R,"size"),c),e.drawArrays(e.TRIANGLES,0,3),[U,k]=[k,U]}}function z(t){if(F=0,j||document.hidden||!O||i.matches)return;if(t>=re){A=0,r.dataset.cloudState="rest",s&&P&&console.info("cloud-motion",JSON.stringify({frames:P,meanFrameMs:$/P,maxFrameMs:q,field:c,glError:e.getError()}));return}if(A&&t-A<16){F=requestAnimationFrame(z);return}const a=A?(t-A)/1e3:1/60,o=Math.min(a,.05);A=t,s&&a<.25&&(P++,$+=a*1e3,q=Math.max(q,a*1e3)),Ee(o),ae(),s&&(r.dataset.cloudFrames=String(P)),s&&V&&(console.info("cloud-first-frame-ms",performance.now()-V),V=0),F=requestAnimationFrame(z)}function W(){!F&&!j&&!document.hidden&&O&&!i.matches&&(A=0,F=requestAnimationFrame(z))}function ne(){const t=n.getBoundingClientRect(),a=Math.min(devicePixelRatio||1,1,900/Math.max(t.width,1),Math.sqrt(52e4/Math.max(1,t.width*t.height)));r.width=Math.max(1,Math.round(t.width*a)),r.height=Math.max(1,Math.round(t.height*a));const o=t.width<600?.68:1;B=[o,o*t.height/Math.max(t.width,1)],ae()}function oe(t,a,o,u){const d=M[M.length-1],y={x:t[0],y:t[1],dx:a,dy:o,speed:u,radius:.075+u*.08,age:0};d&&d.age<.12&&Math.hypot(d.x-t[0],d.y-t[1])<.09?Object.assign(d,y):(M.push(y),M.length>3&&M.shift()),re=performance.now()+6500,r.dataset.cloudState="gust",s&&!F&&(V=performance.now(),P=0,$=0,q=0),W()}function Q(t,a,o,u=!1){if(i.matches)return;const d=n.getBoundingClientRect();if(t<d.left||t>d.right||a<d.top||a>d.bottom){w=null;return}const y=[(t-d.left)/d.width*B[0],(a-d.top)/d.height*B[1]];if(u)oe(y,.98,-.2,.075);else if(w&&o-w.time<240){const me=y[0]-w.p[0],ve=y[1]-w.p[1],H=Math.hypot(me,ve);if(H>2e-4){const ge=H/Math.max(.008,(o-w.time)/1e3);oe(y,me/H,ve/H,Math.min(.14,.015+ge*.11))}}w={p:y,time:o}}const Z=t=>{var a;return(a=t.closest)==null?void 0:a.call(t,"a,button,input,textarea,select")},ie=t=>{t.pointerType!=="touch"&&!Z(t.target)&&Q(t.clientX,t.clientY,t.timeStamp)},ce=t=>{t.pointerType!=="touch"&&!Z(t.target)&&(t.preventDefault(),Q(t.clientX,t.clientY,t.timeStamp,!0))},Y=t=>{const a=t.touches[0];a&&!Z(t.target)&&Q(a.clientX,a.clientY,t.timeStamp,t.type==="touchstart")},L=()=>{w=null},I=()=>{cancelAnimationFrame(F),F=0,A=0,w=null},se=()=>{document.hidden?I():W()},le=()=>{I(),r.dataset.cloudState=i.matches?"reduced":"rest",i.matches||W()},ue=t=>{t.preventDefault(),I(),j=!0,r.dataset.cloudState="fallback"};n.addEventListener("pointermove",ie,{passive:!0}),n.addEventListener("pointerdown",ce),n.addEventListener("pointerleave",L,{passive:!0}),n.addEventListener("pointercancel",L,{passive:!0}),n.addEventListener("touchstart",Y,{passive:!0}),n.addEventListener("touchmove",Y,{passive:!0}),n.addEventListener("touchend",L,{passive:!0}),n.addEventListener("touchcancel",L,{passive:!0}),document.addEventListener("visibilitychange",se),i.addEventListener("change",le),r.addEventListener("webglcontextlost",ue);const de=new IntersectionObserver(([t])=>{O=t.isIntersecting,O?W():I()});de.observe(n);const fe=new ResizeObserver(ne);return fe.observe(n),ne(),r.dataset.cloudState=i.matches?"reduced":"rest",s&&console.info("cloud-volume-ready",JSON.stringify({field:c,steps:x?24:32})),()=>{j=!0,I(),de.disconnect(),fe.disconnect(),n.removeEventListener("pointermove",ie),n.removeEventListener("pointerdown",ce),n.removeEventListener("pointerleave",L),n.removeEventListener("pointercancel",L),n.removeEventListener("touchstart",Y),n.removeEventListener("touchmove",Y),n.removeEventListener("touchend",L),n.removeEventListener("touchcancel",L),document.removeEventListener("visibilitychange",se),i.removeEventListener("change",le),r.removeEventListener("webglcontextlost",ue),D()}}export{we as createCloudField};
