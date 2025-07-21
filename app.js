window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const n = parseInt(urlParams.get('disks')) || 5;
  const basePositionX = -0.4;
  const baseY = 0.025;
  const yStep = 0.05;

  const message = document.getElementById('message');
  const moveButton = document.getElementById('moveButton');
  const cursor = document.querySelector('#cursor');
  const marker = document.querySelector('a-marker[url="assets/fuji.patt"]');

  // ホームボタン追加
  const homeButton = document.createElement('button');
  homeButton.id = 'homeButton';
  homeButton.textContent = 'ホーム';
  Object.assign(homeButton.style, {
    position: 'fixed',
    left: '10px',
    bottom: '20px',
    padding: '10px 12px',
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

  // SUCCESS表示追加
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

  function hslToRgb(h, s, l) {
    // 赤色を除外（h ≈ 345〜15 は赤っぽい）
    if ((h >= 345 && h <= 360) || (h >= 0 && h <= 15)) {
      return null;  // または別の色を返す
    }

    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60)
      [r, g, b] = [c, x, 0];
    else if (60 <= h && h < 120)
      [r, g, b] = [x, c, 0];
    else if (120 <= h && h < 180)
      [r, g, b] = [0, c, x];
    else if (180 <= h && h < 240)
      [r, g, b] = [0, x, c];
    else if (240 <= h && h < 300)
      [r, g, b] = [x, 0, c];
    else
      [r, g, b] = [c, 0, x];

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }


  // 木の色
  const woodLight = '#d67a50ff';  // base
  const woodDark = '#d67a50ff';   // ポール

  // base
  const baseEntity =
      document.querySelector('a-entity[gltf-model="#baseModel"]');
  baseEntity.addEventListener('model-loaded', () => {
    const mesh = baseEntity.getObject3D('mesh');
    if (!mesh) return;

    mesh.traverse(node => {
      if (node.isMesh) {
        // テクスチャがあれば消す
        if (node.material.map) {
          node.material.map = null;
          node.material.needsUpdate = true;
        }
        // 木っぽい色
        node.material.color.set('#d67a50ff');
      }
    });
  });

  // ポールの色
  ['#pole1', '#pole2', '#pole3'].forEach(id => {
    const poleEntity = document.querySelector(id);
    poleEntity.addEventListener('model-loaded', () => {
      const mesh = poleEntity.getObject3D('mesh');
      if (!mesh) return;

      mesh.traverse(node => {
        if (node.isMesh) {
          if (node.material.map) {
            node.material.map = null;
            node.material.needsUpdate = true;
          }
          node.material.color.set('#d67a50ff');
        }
      });
    });
  });
 

  for (let i = 0; i < n; i++) {
    const disk = document.createElement('a-entity');
    disk.setAttribute('id', `disk${i + 1}`);
    disk.setAttribute('class', 'disk clickable');
    disk.setAttribute('gltf-model', '#diskModel');
    const scaleValue = 0.005 - i * 0.0006;
    disk.setAttribute('scale', `${scaleValue} 0.001 ${scaleValue}`);
    const yPos = baseY + i * yStep;
    disk.setAttribute('position', `${basePositionX} ${yPos} 0`);

    const hue = Math.floor((i / n) * 360);
    disk.dataset.hue = hue;

    marker.appendChild(disk);
  }

  const disks = Array.from(document.querySelectorAll('.disk'));
  const originalColors = new Map();

  disks.forEach(disk => {
    disk.addEventListener('model-loaded', () => {
      const mesh = disk.getObject3D('mesh');
      if (!mesh) return;

      const hue = disk.dataset.hue || 0;
      const rgb = hslToRgb(hue, 100, 50);
      const colorStr = `rgb(${rgb.r},${rgb.g},${rgb.b})`;

      mesh.traverse(node => {
        if (node.isMesh) {
          node.material.color.set(colorStr);
          originalColors.set(disk.id, node.material.color.clone());
        }
      });
    });
  });

  function changeDiskColor(entity, color) {
    const mesh = entity.getObject3D('mesh');
    if (!mesh) return;
    mesh.traverse(node => {
      if (node.isMesh) {
        node.material.color.set(color);
      }
    });
  }

  function resetDiskColor(entity) {
    const mesh = entity.getObject3D('mesh');
    const originalColor = originalColors.get(entity.id);
    if (!mesh || !originalColor) return;
    mesh.traverse(node => {
      if (node.isMesh) {
        node.material.color.copy(originalColor);
      }
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

    // 当たった要素
    const target = intersected.find(
        el => el.classList.contains('pole') || el.classList.contains('disk'));

    if (!target) {
      message.innerText = 'ポールまたはディスクを選んでください';
      setTimeout(() => (message.innerText = ''), 2000);
      return;
    }

    // ポールのX座標
    const getPoleXFromTarget = (target) => {
      if (target.classList.contains('pole')) {
        return target.getAttribute('position').x;
      } else if (target.classList.contains('disk')) {
        return target.getAttribute('position').x;
      }
      return null;
    };

    const poleX = getPoleXFromTarget(target);

    // 該当するポール上のディスクを取得
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
      changeDiskColor(selectedDisk, 'red');
      message.innerText = `選択: ${selectedDisk.id}`;
    } else {
      if (Math.abs(fromPole - poleX) < 0.01) {
        resetDiskColor(selectedDisk);
        message.innerText = '選択をキャンセルしました';
        selectedDisk = null;
        fromPole = null;
        setTimeout(() => (message.innerText = ''), 2000);
        return;
      }

      const topDisk = disksOnPole[0];
      const selectedSize = selectedDisk.getAttribute('scale').x;

      if (topDisk) {
        const topSize = topDisk.getAttribute('scale').x;
        if (selectedSize > topSize) {
          message.innerText = '小さいディスクの上に大きいディスクは置けません';
          resetDiskColor(selectedDisk);
          selectedDisk = null;
          fromPole = null;
          setTimeout(() => (message.innerText = ''), 2000);
          return;
        }
      }

      const newY = baseY + disksOnPole.length * yStep;
      selectedDisk.setAttribute('position', {x: poleX, y: newY, z: 0});
      resetDiskColor(selectedDisk);
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
