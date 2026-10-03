// mode-change.js - グローバル変数、ダークモード切替、cropモードUI

var nowMode="";

var isKnifeDrawing=false;
var isKnifeMode=false;

const MODE_PEN_PENCIL='Pencil';
const MODE_PEN_OUTLINE='OutlinePen';
const MODE_PEN_CIRCLE='Circle';
const MODE_PEN_SQUARE='Square';
const MODE_PEN_TEXTURE='Texture';
const MODE_PEN_CRAYON='Crayon';
const MODE_PEN_INK='Ink';
const MODE_PEN_MARKER='Marker';
const MODE_PEN_ERASER='Eraser';
const MODE_PEN_HLINE='Hline';
const MODE_PEN_VLINE='Vline';
const MODE_PEN_MOSAIC='Mosaic';

var isMosaicBrushActive=false;
var cropFrame;
var cropActiveObject;
let nowPencil="";

function showCanvasHelpText(text,highlightKey){
var el=$("canvas-help-text");
if(!el)return;
var escaped=text.replace(highlightKey,'<span class="help-key">'+highlightKey+'</span>');
el.innerHTML=escaped;
el.classList.add("active");
}
function hideCanvasHelpText(){
var el=$("canvas-help-text");
if(!el)return;
el.classList.remove("active");
el.innerHTML="";
}

function applyTheme(mode){
var isDark=mode==='dark-mode';
document.documentElement.classList.remove('dark-mode','light-mode');
document.documentElement.classList.add(mode);
document.body.classList.remove('dark-mode','light-mode');
document.body.classList.add(mode);
var logo=$('navbar-logo');
if(logo){logo.src=isDark?'02_images_svg/Logo/black_mode_logo.webp':'02_images_svg/Logo/light_mode_logo.webp';}
var toggle=$('mode-toggle');
if(toggle){toggle.checked=isDark;}
}

function toggleMode() {
var next=document.body.classList.contains('dark-mode')?'light-mode':'dark-mode';
applyTheme(next);
localStorage.setItem('mode',next);
updateLayerPanel();
}

document.addEventListener('DOMContentLoaded',function() {
var toggle=$('mode-toggle');
if(toggle){toggle.addEventListener('change',toggleMode);}
});

function initializeMode() {
var mode=null;
try{mode=localStorage.getItem('mode');}catch(e){}
if(mode!=='dark-mode'&&mode!=='light-mode'){
mode=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches)?'light-mode':'dark-mode';
}
applyTheme(mode);
}

document.addEventListener('DOMContentLoaded',function() {
initializeMode();
});

function getCssValue(key){
var currentModeElement=document.body;
var rootStyles=getComputedStyle(currentModeElement);
return rootStyles.getPropertyValue(key).trim();
}

function completeCrop(){
if(!cropFrame||!cropActiveObject)return false;
var left=cropFrame.left-cropActiveObject.left;
var top=cropFrame.top-cropActiveObject.top;
left*=1;
top*=1;
var width=cropFrame.width*1;
var height=cropFrame.height*1;
ImageUtil.cropImage(
cropActiveObject,
cropFrame.left,
cropFrame.top,
parseInt(cropFrame.scaleY*height),
parseInt(width*cropFrame.scaleX)
);
cropModeClear();
return true;
}

function startCropMode(targetImage){
if(cropModeClear()){
return true;
}
if(!targetImage){
targetImage=canvas.getActiveObject();
}
if(!targetImage||!isImage(targetImage)){
createToastError("Select Image!","");
return;
}
cropActiveObject=targetImage;
cropFrame=new fabric.Rect({
fill:"rgba(0,0,0,0)",
originX:"left",
originY:"top",
stroke:"rgba(0,0,0,0)",
strokeWidth:0,
width:1,
height:1,
borderColor:"#36fd00",
cornerColor:"green",
hasRotatingPoint:false,
selectable:true,
});
cropFrame.left=cropActiveObject.left;
cropFrame.top=cropActiveObject.top;
cropFrame.width=cropActiveObject.width*cropActiveObject.scaleX;
cropFrame.height=cropActiveObject.height*cropActiveObject.scaleY;
canvas.add(cropFrame);
canvas.setActiveObject(cropFrame);
canvas.renderAll();
showCanvasHelpText(getText("cropHelpText"),"Enter");
}
