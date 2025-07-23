window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const n = parseInt(urlParams.get('disks')) || 5;
  const basePositionX = -0.4;
  const baseY = 0.08;
  const yStep = 0.08;
  const message = document.getElementById('message');
  const moveButton = document.getElementById('moveButton');
  const cursor = document.querySelector('#cursor');
  const marker = document.querySelector('a-marker[url="assets/fuji.patt"]');
  const homeButton = document.createElement('button');
  const originalScales = new Map();
  homeButton.id = 'homeButton';
  homeButton.textContent = 'ホーム';
  Object.assign(homeButton.style, {
    position: 'fixed',
    left: '10px',
    bottom: '20px',
    padding: '20px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    zIndex: 1000,
  });
  homeButton.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
  document.body.appendChild(homeButton);
  const successMessage = document.createElement('div');
  successMessage.id = 'successMessage';
  successMessage.textContent = 'SUCCESS! 🎉';
  Object.assign(successMessage.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '80px',
    fontWeight: 'bold',
    color: 'limegreen',
    textShadow: '2px 2px 6px black',
    zIndex: 2000,
    display: 'none',
    pointerEvents: 'none',
    userSelect: 'none',
  });
  document.body.appendChild(successMessage);
  function showSuccess() {
    successMessage.style.display = 'block';
    setTimeout(() => {
      successMessage.style.display = 'none';
    }, 3000);
  }
  // base読み込みと色の設定
  const baseEntity =
      document.querySelector('a-entity[gltf-model="#baseModel"]');
  baseEntity.addEventListener('model-loaded', () => {
    const mesh = baseEntity.getObject3D('mesh');
    if (!mesh) return;
    mesh.traverse(node => {
      if (node.isMesh) {
        if (node.material.map) {
          node.material.map = null;
        }
        node.material.color.set('#8B5E3C');
        node.material.emissive.set('#2C1606');
        node.material.emissiveIntensity = 0.1;
        node.material.metalness = 0.0;
        node.material.roughness = 0.8;
        node.material.needsUpdate = true;
      }
    });
  });
  // ポールの読み込みと色の設定
  ['#pole1', '#pole2', '#pole3'].forEach(id => {
    const poleEntity = document.querySelector(id);
    poleEntity.addEventListener('model-loaded', () => {
      const mesh = poleEntity.getObject3D('mesh');
      if (!mesh) return;
      mesh.traverse(node => {
        if (node.isMesh) {
          if (node.material.map) {
            node.material.map = null;
          }
          node.material.color.set('#8B5E3C');
          node.material.emissive.set('#2C1606');
          node.material.emissiveIntensity = 0.1;
          node.material.metalness = 0.0;
          node.material.roughness = 0.8;
          node.material.needsUpdate = true;  //これがないと色が反映されない
        }
      });
    });
  });
  // ディスクの生成
  for (let i = 0; i < n; i++) {
    const disk = document.createElement('a-entity');
    disk.setAttribute('id', `disk${i + 1}`);
    disk.setAttribute('class', 'disk clickable');
    disk.setAttribute('gltf-model', '#diskModel');
    const scaleValue = 0.05 - i * 0.0055;
    disk.setAttribute('scale', `${scaleValue} 0.001 ${scaleValue}`);
    originalScales.set(
        `disk${i + 1}`, {x: scaleValue, y: 0.001, z: scaleValue});
    const yPos = baseY + i * yStep - 0.02 * i;
    disk.setAttribute('position', `${basePositionX} ${yPos} 0`);
    disk.dataset.hue = Math.floor((i / n) * 360);
    marker.appendChild(disk);
  }
  const disks = Array.from(document.querySelectorAll('.disk'));
  const originalColors = new Map();
  // ディスクの読み込みと色の設定
  disks.forEach((disk, i) => {
    disk.addEventListener('model-loaded', () => {
      const mesh = disk.getObject3D('mesh');
      if (!mesh) return;
      const palette = [
        '#FF0000', '#FF7F00', '#FFFF00', '#26ff00', '#4bfdfa', '#1119fd',
        '#8B00FF'
      ];
      const colorStr = palette[i];
      mesh.traverse(node => {
        if (node.isMesh) {
          node.material.color.set(colorStr);
          node.material.emissive.set(colorStr);
          node.material.emissiveIntensity = 0.1;
          node.material.metalness = 0.0;
          node.material.roughness = 0.8;
          node.material.needsUpdate = true;
          originalColors.set(disk.id, node.material.color.clone());
        }
      });
    });
  });
  function changeDiskSize(entity) {
    const scale = entity.getAttribute('scale');
    entity.setAttribute('scale', {
      x: scale.x * 1.2,
      y: scale.y * 1.2,
      z: scale.z * 1.2,
    });
  }
  function resetDiskSize(entity) {
    const originalScale = originalScales.get(entity.id);
    if (!originalScale) return;
    entity.setAttribute('scale', {
      x: originalScale.x,
      y: originalScale.y,
      z: originalScale.z,
    });
  }
  function checkSuccess() {
    const polesX = [0, 0.4];
    for (const poleX of polesX) {
      const count = disks
                        .filter(disk => {
                          const pos = disk.getAttribute('position');
                          return Math.abs(pos.x - poleX) < 0.01;
                        })
                        .length;
      if (count === n) {
        showSuccess();
        return true;
      }
    }
    return false;
  }
  let selectedDisk = null;
  let fromPole = null;
  moveButton.addEventListener('click', () => {
    const intersected = cursor.components.raycaster.intersectedEls;
    if (!intersected || intersected.length === 0) {
      message.innerText = 'カーソルが物体に当たっていません';
      setTimeout(() => (message.innerText = ''), 2000);
      return;
    }
    const target = intersected.find(
        el => el.classList.contains('pole') || el.classList.contains('disk'));
    if (!target) {
      message.innerText = 'ポールまたはディスクを選んでください';
      setTimeout(() => (message.innerText = ''), 2000);
      return;
    }
    const getPoleXFromTarget = (target) => {
      if (target.classList.contains('pole')) {
        return target.getAttribute('position').x;
      } else if (target.classList.contains('disk')) {
        return target.getAttribute('position').x;
      }
      return null;
    };
    const poleX = getPoleXFromTarget(target);
    const disksOnPole = disks
                            .filter(disk => {
                              const pos = disk.getAttribute('position');
                              return Math.abs(pos.x - poleX) < 0.01;
                            })
                            .sort(
                                (a, b) => b.getAttribute('position').y -
                                    a.getAttribute('position').y);
    if (!selectedDisk) {
      if (disksOnPole.length === 0) {
        message.innerText = 'このポールにはディスクがありません';
        setTimeout(() => (message.innerText = ''), 2000);
        return;
      }
      selectedDisk = disksOnPole[0];
      fromPole = poleX;
      changeDiskSize(selectedDisk);
      message.innerText = `選択: ${selectedDisk.id}`;
      setTimeout(() => (message.innerText = ''), 10000);
    } else {
      if (Math.abs(fromPole - poleX) < 0.01) {
        resetDiskSize(selectedDisk);
        message.innerText = '選択をキャンセルしました';
        selectedDisk = null;
        fromPole = null;
        setTimeout(() => (message.innerText = ''), 2000);
        return;
      }
      const topDisk = disksOnPole[0];
      if (topDisk) {
        const selectedOriginalScale = originalScales.get(selectedDisk.id);
        const topOriginalScale = originalScales.get(topDisk.id);
        if (!selectedOriginalScale || !topOriginalScale) {
          console.warn('originalScalesが見つかりません');
        }
        const selectedSize = selectedOriginalScale?.x || 0;
        const topSize = topOriginalScale?.x || 0;
        if (selectedSize > topSize) {
          message.innerText = '小さいディスクの上に大きいディスクは置けません';
          resetDiskSize(selectedDisk);
          selectedDisk = null;
          fromPole = null;
          setTimeout(() => (message.innerText = ''), 2000);
          return;
        }
      }
      const newY = baseY + disksOnPole.length * yStep;
      selectedDisk.setAttribute('position', {x: poleX, y: newY, z: 0});
      resetDiskSize(selectedDisk);
      message.innerText = `${selectedDisk.id} を移動しました`;
      selectedDisk = null;
      fromPole = null;
      checkSuccess();
      setTimeout(() => {
        message.innerText = '';
      }, 2000);
    }
  });
});
