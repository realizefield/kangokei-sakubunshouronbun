// 合言葉の照合用（SHA-256）。合言葉そのものはどこにも保存しません。
function gateNorm(s){s=String(s==null?"":s);try{s=s.normalize("NFKC")}catch(e){}return s.replace(/\s+/g,"").toLowerCase()}
function sha256(str){
  var rr=function(v,a){return (v>>>a)|(v<<(32-a))};
  var m=unescape(encodeURIComponent(str)),l=m.length,w=[],i,j,H=[],K=[],pc=0,isP={};
  for(var c=2;pc<64;c++){if(!isP[c]){for(i=0;i<313;i+=c)isP[i]=c;H[pc]=(Math.pow(c,.5)*4294967296)|0;K[pc++]=(Math.pow(c,1/3)*4294967296)|0}}
  H=H.slice(0,8);
  m+="\x80";while(m.length%64-56)m+="\x00";
  for(i=0;i<m.length;i++){j=m.charCodeAt(i);w[i>>2]|=j<<((3-i)%4)*8}
  w[w.length]=((l*8)/4294967296)|0;w[w.length]=(l*8)|0;
  for(j=0;j<w.length;){
    var W=w.slice(j,j+=16),oh=H;H=H.slice(0,8);
    for(i=0;i<64;i++){
      var w15=W[i-15],w2=W[i-2],a=H[0],e=H[4];
      var t1=H[7]+(rr(e,6)^rr(e,11)^rr(e,25))+((e&H[5])^((~e)&H[6]))+K[i]+(W[i]=(i<16)?W[i]:(W[i-16]+(rr(w15,7)^rr(w15,18)^(w15>>>3))+W[i-7]+(rr(w2,17)^rr(w2,19)^(w2>>>10))|0));
      var t2=(rr(a,2)^rr(a,13)^rr(a,22))+((a&H[1])^(a&H[2])^(H[1]&H[2]));
      H=[(t1+t2)|0].concat(H);H[4]=(H[4]+t1)|0;
    }
    for(i=0;i<8;i++)H[i]=(H[i]+oh[i])|0;
  }
  var out="";for(i=0;i<8;i++){for(j=3;j+1;j--){var b=(H[i]>>(j*8))&255;out+=(b<16?"0":"")+b.toString(16)}}
  return out}
