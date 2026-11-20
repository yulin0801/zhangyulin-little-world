const header=document.querySelector('.site-header');
const groups=[...header.querySelectorAll('.nav-group')];
const menu=header.querySelector('.main-menu-toggle');
function closeGroups(except=null){for(const group of groups){if(group===except)continue;group.classList.remove('is-open');group.querySelector('.nav-toggle').setAttribute('aria-expanded','false');}}
function openGroup(group){closeGroups(group);group.classList.add('is-open');group.querySelector('.nav-toggle').setAttribute('aria-expanded','true');}
function closeMenu(){header.classList.remove('menu-open');menu.setAttribute('aria-expanded','false');closeGroups();}
menu.addEventListener('click',()=>{const open=!header.classList.contains('menu-open');header.classList.toggle('menu-open',open);menu.setAttribute('aria-expanded',String(open));if(!open)closeGroups();});
for(const group of groups){const button=group.querySelector('.nav-toggle');
group.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&matchMedia('(min-width:851px)').matches)openGroup(group);});
group.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!group.contains(document.activeElement))closeGroups();});
group.addEventListener('focusin',event=>{if(event.target!==button&&matchMedia('(min-width:851px)').matches)openGroup(group);});
group.addEventListener('focusout',e=>{if(!group.contains(e.relatedTarget)&&(matchMedia('(min-width:851px)').matches||!header.contains(e.relatedTarget)))closeGroups();});
button.addEventListener('click',event=>{if(event.pointerType==='mouse'&&matchMedia('(min-width:851px)').matches)openGroup(group);else if(group.classList.contains('is-open'))closeGroups();else openGroup(group);});
group.querySelector('.nav-label').addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();openGroup(group);group.querySelector('.nav-dropdown a').focus();}});
}
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.site-header'))closeMenu();else if(!event.target.closest('.nav-group')&&matchMedia('(min-width:851px)').matches)closeGroups();});
document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;const opened=groups.find(g=>g.classList.contains('is-open'));if(opened){opened.querySelector('.nav-toggle').focus();closeGroups();}else if(header.classList.contains('menu-open')){closeMenu();menu.focus();}});
window.addEventListener('hashchange',closeMenu);
