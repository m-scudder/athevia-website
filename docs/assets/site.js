const APP_STORE_URL = "";
const links=document.querySelectorAll(".js-download-link");
const notes=document.querySelectorAll(".js-store-note");
if(APP_STORE_URL){
  links.forEach(a=>{a.href=APP_STORE_URL;a.target="_blank";a.rel="noopener noreferrer"});
  notes.forEach(n=>n.textContent="Available on the App Store.");
}else{
  links.forEach(a=>a.addEventListener("click",e=>{e.preventDefault();document.querySelector("#download")?.scrollIntoView({behavior:"smooth"})}));
}
const year=document.querySelector("#year");if(year)year.textContent=new Date().getFullYear();
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");observer.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));
const btn=document.querySelector(".menu-button"),nav=document.querySelector(".site-header nav");
btn?.addEventListener("click",()=>{const open=nav.classList.toggle("open");btn.setAttribute("aria-expanded",String(open))});