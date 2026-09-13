const $=s=>document.querySelector(s);
const uid=$("#uid"), region=$("#region"), btn=$("#check"), status=$("#status"), result=$("#result");

function esc(v){return String(v??"—").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function item(k,v){return `<div class="item"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`;}
function render(d, requestedUid){
  const a=d.AccountInfo||{}, p=d.AccountProfileInfo||{}, e=d.EquippedItemsInfo||{}, s=d.SocialInfo||{}, g=d.GuildInfo||{};
  result.innerHTML=`
    <div class="title"><h2>${esc(a.AccountName||"Player")}</h2><div class="pill">${esc(a.AccountRegion||region.value||"AUTO")}</div></div>
    <div class="grid">
      ${item("UID",s.accountId||requestedUid)}
      ${item("Level",a.AccountLevel)}
      ${item("EXP",a.AccountEXP)}
      ${item("Likes",a.AccountLikes)}
      ${item("Last Login",a.AccountLastLogin)}
      ${item("Create Time",a.AccountCreateTime)}
      ${item("Season ID",a.AccountSeasonId)}
      ${item("Gender",s.gender)}
      ${item("Language",s.language)}
      ${item("BR Max Rank",p.BrMaxRank)}
      ${item("BR Rank Points",p.BrRankPoint)}
      ${item("CS Max Rank",p.CsMaxRank)}
      ${item("CS Rank Points",p.CsRankPoint)}
    </div>
    <div class="section">GUILD</div>
    <div class="grid">
      ${item("Guild ID",g.GuildID)}
      ${item("Guild Name",g.GuildName)}
      ${item("Guild Level",g.GuildLevel)}
    </div>
    <div class="section">EQUIPPED ITEMS</div>
    <div class="grid">
      ${item("Avatar ID",e.EquippedAvatarId)}
      ${item("BP Badges",e.EquippedBPBadges)}
      ${item("BP ID",e.EquippedBPID)}
      ${item("Banner ID",e.EquippedBannerId)}
    </div>`;
  result.classList.remove("hidden");
}
btn.onclick=async()=>{
  const id=uid.value.trim(), rg=region.value;
  if(!/^\d{5,20}$/.test(id)){status.textContent="Enter a valid UID (5–20 digits).";status.className="err";return;}
  btn.disabled=true;btn.textContent="CHECKING…";status.className="";status.textContent="Fetching player data…";result.classList.add("hidden");
  try{
    const r=await fetch("/api/check-uid",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({uid:id,region:rg})});
    const d=await r.json();
    if(!r.ok) throw new Error(d.error||"Request failed");
    if(!d.AccountInfo && !d.SocialInfo) throw new Error("Player data was not found.");
    render(d,id);status.textContent="✓ Player data loaded.";
  }catch(e){status.textContent="✕ "+e.message;status.className="err";}
  finally{btn.disabled=false;btn.textContent="CHECK UID";}
};
uid.addEventListener("keydown",e=>{if(e.key==="Enter")btn.click()});
                                                                                       
