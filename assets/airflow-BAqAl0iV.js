function M(r,o){var e=Math.imul(r,668265261)^Math.imul(o,374761393);return e=Math.imul(e^e>>>15,739982445),e=Math.imul(e^e>>>12,695872825),((e^e>>>15)>>>0)/4294967296}function pe(r){return r*r*(3-2*r)}var w=6;function N(r,o,e){var x=Math.floor(r),c=Math.floor(o),u=r-x,n=o-c,s=(x%e+e)%e,E=(s+1)%e,f=(c%e+e)%e,g=(f+1)%e,p=M(s,f),m=M(E,f),v=M(s,g),R=M(E,g),b=pe(u),h=pe(n);return p+(m-p)*b+(v-p)*h+(p-m-v+R)*b*h}function ee(r,o){return N(r,o,w)*.5163+N(r*2,o*2,w*2)*.2581+N(r*4,o*4,w*4)*.129+N(r*8,o*8,w*8)*.0645+N(r*16,o*16,w*16)*.0321}function be(r){const o=[[.14,.12,.85],[.56,.17,.68],[.89,.3,1.1],[.7,.45,.82],[.25,.55,1],[.68,.73,.9],[.02,.87,.76],[.91,.98,1]],e=[];o.forEach(([c,u,n],s)=>{const E=(M(s,91)-.5)*.65;e.push({x:c,y:u,rx:.102*n,ry:.039*n,tilt:E,strength:.8});for(let f=0;f<11;f++){const g=M(s,f)*Math.PI*2,p=Math.sqrt(M(f+20,s)),m=(.017+M(s+40,f)*.025)*n;e.push({x:c+Math.cos(g)*.078*p*n,y:u+Math.sin(g)*.037*p*n,rx:m*(1.05+M(f,s+50)*.7),ry:m,tilt:E,strength:.25+M(f,s+80)*.3})}for(let f=0;f<4;f++)e.push({x:c+(.075+f*.019)*n,y:u+(.016+M(s,f+120)*.028)*n,rx:.027*n,ry:(.007+M(s,f+140)*.007)*n,tilt:-.16,strength:.15})});const x=new Float32Array(r*r*4);for(let c=0;c<r;c++)for(let u=0;u<r;u++){const n=(u+.5)/r,s=(c+.5)/r,E=(ee(n*w*2,s*w*2)-.5)*.021,f=(ee(n*w*2+2.1,s*w*2+4.7)-.5)*.017;let g=0;for(const m of e){let v=n+E-m.x,R=s+f-m.y;v-=Math.round(v),R-=Math.round(R);const b=(v+m.tilt*R)/m.rx,h=(R-m.tilt*v)/m.ry,T=b*b+h*h;T<6&&(g+=Math.exp(-T*1.4)*m.strength)}const p=ee(n*w*6,s*w*6);x[(c*r+u)*4]=Math.max(0,1-Math.exp(-g*1.25)-(p-.32)*.26)}return x}const Ee=`
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
${Ee}
void main(){result=texture(source,departure(uv));}
`,Re=`#version 300 es
precision highp float;
in vec2 uv;out vec4 result;
uniform sampler2D source;
uniform sampler2D forwardField;
uniform sampler2D backwardField;
uniform float size;
${Ee}
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
`;function ye(r=32){const o=new Uint8Array(r*r*r),e=(c,u,n)=>{let s=Math.imul(c,73856093)^Math.imul(u,19349663)^Math.imul(n,83492791);return s=Math.imul(s^s>>>13,1274126177),((s^s>>>16)>>>0)/4294967295};function x(c,u,n,s){const E=Math.floor(c),f=Math.floor(u),g=Math.floor(n),p=h=>h*h*(3-2*h),m=p(c-E),v=p(u-f),R=p(n-g);let b=0;for(let h=0;h<2;h++)for(let T=0;T<2;T++)for(let y=0;y<2;y++)b+=e((E+y)%s,(f+T)%s,(g+h)%s)*(y?m:1-m)*(T?v:1-v)*(h?R:1-R);return b}for(let c=0;c<r;c++)for(let u=0;u<r;u++)for(let n=0;n<r;n++)o[(c*r+u)*r+n]=Math.round(255*(x(n*4/r,u*4/r,c*4/r,4)*.62+x(n*8/r,u*8/r,c*8/r,8)*.28+x(n*16/r,u*16/r,c*16/r,16)*.1));return o}const Me=`#version 300 es
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
  float n = texture(detail, vec3(material * 11., altitude * 12. + .5)).r;
  float small = texture(detail, vec3(material * 31. + .37, altitude * 30.)).r;
  float z = altitude / .095;
  // Rounded billows, porous rims and progressively thinner torn wisps.
  return max(0., base * 2.1 - z * z - .09 - n * .72 - small * .3) * 1.8;
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
    float direct = exp(-opticalDepth * 19.);
    float ambient = .72 + .12 * (samplePoint.z / .13 * .5 + .5);
    vec3 lighting = vec3(.79, .86, .98) * ambient + vec3(1., .98, .94) * (.34 * direct);
    float absorbed = 1. - exp(-den * dz * 75.);
    radiance += transmittance * absorbed * lighting;
    transmittance *= 1. - absorbed;
  }
  float alpha = 1. - transmittance;
  result = vec4(radiance / max(alpha, .0001), alpha);
}
`;function we(r,o){const e=r.getContext("webgl2",{alpha:!0,antialias:!1,depth:!1,premultipliedAlpha:!1});if(!e||!e.getExtension("EXT_color_buffer_float"))return r.dataset.cloudState="fallback",()=>{};const x=matchMedia("(pointer: coarse)").matches,c=matchMedia("(prefers-reduced-motion: reduce)"),u=new URLSearchParams(location.search).has("cloud-debug"),n=x?256:384,s=[],E=[],f=[],g=[],p=`#version 300 es
    out vec2 uv;
    void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0,1);}`;function m(t){const a=e.createProgram();s.push(a);for(const[i,l]of[[e.VERTEX_SHADER,p],[e.FRAGMENT_SHADER,t]]){const d=e.createShader(i);if(e.shaderSource(d,l),e.compileShader(d),!e.getShaderParameter(d,e.COMPILE_STATUS)){const A=e.getShaderInfoLog(d);throw e.deleteShader(d),Error(A)}e.attachShader(a,d),e.deleteShader(d)}if(e.linkProgram(a),!e.getProgramParameter(a,e.LINK_STATUS))throw Error(e.getProgramInfoLog(a));return{id:a,uniforms:new Map}}function v(t,a){return t.uniforms.has(a)||t.uniforms.set(a,e.getUniformLocation(t.id,a)),t.uniforms.get(a)}function R(){s.forEach(t=>e.deleteProgram(t)),E.forEach(t=>e.deleteTexture(t)),f.forEach(t=>e.deleteFramebuffer(t)),g.forEach(t=>e.deleteVertexArray(t))}function b(t=null){const a=e.createTexture();E.push(a),e.bindTexture(e.TEXTURE_2D,a),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.REPEAT),e.texImage2D(e.TEXTURE_2D,0,e.RGBA16F,n,n,0,e.RGBA,e.FLOAT,t);const i=e.createFramebuffer();if(f.push(i),e.bindFramebuffer(e.FRAMEBUFFER,i),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,a,0),e.checkFramebufferStatus(e.FRAMEBUFFER)!==e.FRAMEBUFFER_COMPLETE)throw Error("Cloud target unavailable");return{texture:a,framebuffer:i}}let h,T,y,U,k,C,J,G;try{h=m(Te),T=m(Re),y=m(Me);const t=e.createVertexArray();g.push(t),e.bindVertexArray(t),U=b(be(n)),k=b(),C=b(),J=b(),G=e.createTexture(),E.push(G),e.bindTexture(e.TEXTURE_3D,G),e.texParameteri(e.TEXTURE_3D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_3D,e.TEXTURE_MAG_FILTER,e.LINEAR);for(const a of[e.TEXTURE_WRAP_S,e.TEXTURE_WRAP_T,e.TEXTURE_WRAP_R])e.texParameteri(e.TEXTURE_3D,a,e.REPEAT);e.texImage3D(e.TEXTURE_3D,0,e.R8,32,32,32,0,e.RED,e.UNSIGNED_BYTE,ye()),e.useProgram(y.id),e.uniform1i(v(y,"steps"),x?24:32)}catch(t){return console.warn("Cloud field fallback:",t),R(),r.dataset.cloudState="fallback",()=>{}}const F=[],te=new Float32Array(20),re=new Float32Array(20);let L=null,B=[1,1],_=0,D=0,ae=0,j=!0,O=!1,P=0,$=0,q=0,V=0;function X(t,a,i,l,d=e.TEXTURE_2D){e.activeTexture(e.TEXTURE0+l),e.bindTexture(d,i),e.uniform1i(v(t,a),l)}function ne(){e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,r.width,r.height),e.useProgram(y.id),X(y,"cloud",U.texture,0),X(y,"detail",G,1,e.TEXTURE_3D),e.uniform2fv(v(y,"view"),B),e.drawArrays(e.TRIANGLES,0,3)}function K(t,a,i,l){e.bindFramebuffer(e.FRAMEBUFFER,a.framebuffer),e.viewport(0,0,n,n),e.useProgram(t.id),X(t,"source",i.texture,0),e.uniform1f(v(t,"dt"),l),e.uniform1i(v(t,"gustCount"),F.length),e.uniform4fv(v(t,"gustGeometry[0]"),te),e.uniform4fv(v(t,"gustMotion[0]"),re)}function ge(t){for(let i=F.length-1;i>=0;i--){const l=F[i];if(l.age+=t,l.age>6){F.splice(i,1);continue}const d=l.speed*t*Math.exp(-l.age*1.5)*.65;l.x+=l.dx*d,l.y+=l.dy*d}F.forEach((i,l)=>{te.set([i.x,i.y,i.radius,i.age],l*4),re.set([i.dx,i.dy,i.speed,0],l*4)});const a=Math.max(1,Math.ceil(t/.025));for(let i=0;i<a;i++){const l=t/a;K(h,C,U,l),e.drawArrays(e.TRIANGLES,0,3),K(h,J,C,-l),e.drawArrays(e.TRIANGLES,0,3),K(T,k,U,l),X(T,"forwardField",C.texture,1),X(T,"backwardField",J.texture,2),e.uniform1f(v(T,"size"),n),e.drawArrays(e.TRIANGLES,0,3),[U,k]=[k,U]}}function z(t){if(_=0,O||document.hidden||!j||c.matches)return;if(t>=ae){D=0,r.dataset.cloudState="rest",u&&P&&console.info("cloud-motion",JSON.stringify({frames:P,meanFrameMs:$/P,maxFrameMs:q,field:n,glError:e.getError()}));return}if(D&&t-D<16){_=requestAnimationFrame(z);return}const a=D?(t-D)/1e3:1/60,i=Math.min(a,.05);D=t,u&&a<.25&&(P++,$+=a*1e3,q=Math.max(q,a*1e3)),ge(i),ne(),u&&(r.dataset.cloudFrames=String(P)),u&&V&&(console.info("cloud-first-frame-ms",performance.now()-V),V=0),_=requestAnimationFrame(z)}function W(){!_&&!O&&!document.hidden&&j&&!c.matches&&(D=0,_=requestAnimationFrame(z))}function oe(){const t=o.getBoundingClientRect(),a=Math.min(devicePixelRatio||1,1,900/Math.max(t.width,1),Math.sqrt(52e4/Math.max(1,t.width*t.height)));r.width=Math.max(1,Math.round(t.width*a)),r.height=Math.max(1,Math.round(t.height*a));const i=t.width<600?.68:1;B=[i,i*t.height/Math.max(t.width,1)],ne()}function ie(t,a,i,l){const d=F[F.length-1],A={x:t[0],y:t[1],dx:a,dy:i,speed:l,radius:.075+l*.08,age:0};d&&d.age<.12&&Math.hypot(d.x-t[0],d.y-t[1])<.09?Object.assign(d,A):(F.push(A),F.length>3&&F.shift()),ae=performance.now()+6500,r.dataset.cloudState="gust",u&&!_&&(V=performance.now(),P=0,$=0,q=0),W()}function Q(t,a,i,l=!1){if(c.matches)return;const d=o.getBoundingClientRect();if(t<d.left||t>d.right||a<d.top||a>d.bottom){L=null;return}const A=[(t-d.left)/d.width*B[0],(a-d.top)/d.height*B[1]];if(l)ie(A,.98,-.2,.075);else if(L&&i-L.time<240){const ve=A[0]-L.p[0],he=A[1]-L.p[1],H=Math.hypot(ve,he);if(H>2e-4){const xe=H/Math.max(.008,(i-L.time)/1e3);ie(A,ve/H,he/H,Math.min(.14,.015+xe*.11))}}L={p:A,time:i}}const Z=t=>{var a;return(a=t.closest)==null?void 0:a.call(t,"a,button,input,textarea,select")},ce=t=>{t.pointerType!=="touch"&&!Z(t.target)&&Q(t.clientX,t.clientY,t.timeStamp)},se=t=>{t.pointerType!=="touch"&&!Z(t.target)&&(t.preventDefault(),Q(t.clientX,t.clientY,t.timeStamp,!0))},Y=t=>{const a=t.touches[0];a&&!Z(t.target)&&Q(a.clientX,a.clientY,t.timeStamp,t.type==="touchstart")},S=()=>{L=null},I=()=>{cancelAnimationFrame(_),_=0,D=0,L=null},ue=()=>{document.hidden?I():W()},le=()=>{I(),r.dataset.cloudState=c.matches?"reduced":"rest",c.matches||W()},de=t=>{t.preventDefault(),I(),O=!0,r.dataset.cloudState="fallback"};o.addEventListener("pointermove",ce,{passive:!0}),o.addEventListener("pointerdown",se),o.addEventListener("pointerleave",S,{passive:!0}),o.addEventListener("pointercancel",S,{passive:!0}),o.addEventListener("touchstart",Y,{passive:!0}),o.addEventListener("touchmove",Y,{passive:!0}),o.addEventListener("touchend",S,{passive:!0}),o.addEventListener("touchcancel",S,{passive:!0}),document.addEventListener("visibilitychange",ue),c.addEventListener("change",le),r.addEventListener("webglcontextlost",de);const fe=new IntersectionObserver(([t])=>{j=t.isIntersecting,j?W():I()});fe.observe(o);const me=new ResizeObserver(oe);return me.observe(o),oe(),r.dataset.cloudState=c.matches?"reduced":"rest",u&&console.info("cloud-volume-ready",JSON.stringify({field:n,steps:x?24:32})),()=>{O=!0,I(),fe.disconnect(),me.disconnect(),o.removeEventListener("pointermove",ce),o.removeEventListener("pointerdown",se),o.removeEventListener("pointerleave",S),o.removeEventListener("pointercancel",S),o.removeEventListener("touchstart",Y),o.removeEventListener("touchmove",Y),o.removeEventListener("touchend",S),o.removeEventListener("touchcancel",S),document.removeEventListener("visibilitychange",ue),c.removeEventListener("change",le),r.removeEventListener("webglcontextlost",de),R()}}export{we as createCloudField};
