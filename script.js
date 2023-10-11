// 获取所有蒙版元素
const masks = document.querySelectorAll('.mask');
function changeMask(state) {
  // 遍历所有蒙版元素并分别改变它们的透明度
  masks.forEach(mask => {
    if (state) {
      TweenMax.to(mask, 1.5, {
        opacity: 0.5, // 目标透明度为0.5
        ease: Power2.easeInOut, // 缓动函数，根据需要选择
      });
    } else {
      TweenMax.to(mask, 1.5, {
        opacity: 0, // 目标透明度为0（完全透明）
        ease: Power2.easeInOut, // 缓动函数，根据需要选择
      });
    }
  });
}


// 获取所有容器元素
const containers = [...document.querySelectorAll('.image-container')];
let currentIndex = 0; // 当前要插入的图片索引
const picnum = 314;//图片总数
const divheight = 480;//包裹图片的div最小高度，在删除图片时有用
function insertImageIntoContainers() {
  const img = document.createElement('img');
  img.id = 'image' + currentIndex;
  img.src = `image/` + (currentIndex % picnum) + '.png'; // 这个取余要看图片数量

  // 创建一个外层 div 容器，包裹图片
  const imageContainerDiv = document.createElement('div');
  imageContainerDiv.style.minHeight=divheight+'px';
  imageContainerDiv.classList.add('image-container-div');
  imageContainerDiv.id = ('image-container-div'+currentIndex);
  imageContainerDiv.appendChild(img);

  // 遍历容器，插入图片容器
  containers[currentIndex % 4].appendChild(imageContainerDiv);

  // 使用IntersectionObserver来监视图片容器是否在可视区域内
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.boundingClientRect.bottom < 0) {
        // 图片容器不在可视区域内，删除它
        const imgToRemove = entry.target;
        imgToRemove.parentElement.removeChild(imgToRemove);
        // 解除对该容器的监听
      observer.unobserve(imgToRemove);
      }
    });
  });

  // 监视图片容器是否在可视区域内
  observer.observe(img);

  currentIndex++;
  if(currentIndex==5000){
    window.location.reload();
  }
}
// 在页面加载时执行多次
window.onload = function () {
  for (let i = 0; i < 25; i++) {
    insertImageIntoContainers();
  }

  // 然后每隔一定时间调用 insertImageIntoContainers 函数，可以根据需要调整时间间隔
  setInterval(insertImageIntoContainers, 1500);
};


let times = 1;
let scrollDistance = 100; // 每次滚动的距离，根据需要调整
function calculateNewY() {
  return -scrollDistance * times;
}

function scrollAnimation() {
  gsap.to('.image-container', {
    y: calculateNewY(),
    duration: 3,
    ease: 'linear',
    onUpdate: function () {
      if (this.progress() === 1) {
        times++;
        // 动画完成后，继续滚动
        scrollAnimation();
      }
    },
  });
}
// 初始调用滚动动画
scrollAnimation();

//蒙版反向移动
function scrollMask() {
  gsap.to('.mask', {
    y: -calculateNewY(),
    duration: 3,
    ease: 'linear',
    onUpdate: function () {
      if (this.progress() === 1) {
        // 动画完成后，继续滚动
        scrollMask();
      }
    },
  });
}
// 初始调用滚动动画
scrollMask();

var poping = false;//pop互斥进行,定义布尔值
let currentpop = 0;//已经触发缩放的图片索引
const windowArea =15;//随机窗口大小
function popupAnimation(maxRecursionCount = 10) {
  const randomImageIndex = Math.floor(Math.random() * windowArea+currentpop+1);//控制目的图片索引范围
  const randomImageId = 'image-container-div' + randomImageIndex;

  const element = document.getElementById(randomImageId);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      //如果元素在视窗内且互斥pop
      if (entry.isIntersecting && entry.intersectionRatio === 1.0 && poping == false) {
        currentpop=randomImageIndex;
        triggerPopupAnimation(randomImageId);
        observer.disconnect(); // 停止监听，以免重复触发
      }
      // 如果元素不再视窗内且递归次数未达到上限，重新寻找一个元素并触发动画 
      else if (!entry.isIntersecting && maxRecursionCount > 0) {

        observer.disconnect(); // 停止监听
        popupAnimation(maxRecursionCount - 1); // 递归调用，减少递归次数
      }
    });
  });
  if (element) {
    observer.observe(element);
  }
}


function triggerPopupAnimation(imageId) {
  poping = true;

  const image = document.getElementById(imageId);
  var parent = image.parentNode;
  parent.style.zIndex = '1';//此列置最上
  image.style.zIndex='2';//此图置最上


  // 获取屏幕中心的位置
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  // 获取要移动元素的位置
  const elementX = image.getBoundingClientRect().left + image.offsetWidth / 2;
  const elementY = image.getBoundingClientRect().top + image.offsetHeight / 2;

  // 计算要移动的距离
  const deltaX = centerX - elementX;
  const deltaY = centerY - elementY;

  changeMask(1);

  gsap.to(image, {
    scale: 2,
    x: deltaX,
    y: deltaY,
    duration: 1.5,
    ease: 'power2.inOut',
    onComplete: function () {
      // 在最大放大状态停留1秒，然后再执行还原动画
      gsap.to(image, {
        scale: 2, // 保持最大放大状态
        x: deltaX,
        y: deltaY,
        duration: 1, // 停留时间（1秒）
        onComplete: function () {
          changeMask(0);
          // 弹出动画完成后，还原大小
          gsap.to(image, {
            scale: 1,
            x: 0, // 将x和y还原到原始位置
            y: 0,
            duration: 1.5,
            ease: 'power2.inOut',
            onComplete: function () {
                // 重置z-index
              containers.forEach((container) => {
                container.style.zIndex = '';
              });
              image.style.zIndex='';
              poping = false;
            },
          });
        },
      });
    },
  });
}
// 每隔一定时间调用popupAnimation函数，可以根据需要调整时间间隔
setInterval(popupAnimation, 2000);

