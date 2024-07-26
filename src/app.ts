import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as CANNON from 'cannon-es';
import * as TWEEN from "@tweenjs/tween.js";


class ThreeJSContainer {
    private scene: THREE.Scene;
    private light: THREE.Light;
    private light1: THREE.Light;


    constructor() {

    }

    // 画面部分の作成(表示する枠ごとに)*
    public createRendererDOM = (width: number, height: number, cameraPos: THREE.Vector3) => {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        renderer.setClearColor(new THREE.Color(0x495ed));
        renderer.shadowMap.enabled = true; //シャドウマップを有効にする

        //カメラの設定
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.copy(cameraPos);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        const orbitControls = new OrbitControls(camera, renderer.domElement);

        this.createScene();
        // 毎フレームのupdateを呼んで，render
        // reqestAnimationFrame により次フレームを呼ぶ
        const render: FrameRequestCallback = (time) => {
            orbitControls.update();

            renderer.render(this.scene, camera);
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);

        renderer.domElement.style.cssFloat = "left";
        renderer.domElement.style.margin = "10px";
        return renderer.domElement;
    }

    // シーンの作成(全体で1回)
    private createScene = () => {
        this.scene = new THREE.Scene();

        const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
        world.defaultContactMaterial.restitution = 0.0;
        world.defaultContactMaterial.friction = 0.00;



        // 風鈴作成
        let SphereSize: number = 1;     // Sphereのサイズを決める
        let addSphereGeometry: THREE.BufferGeometry = new THREE.SphereGeometry(SphereSize, 32, 16, 0, Math.PI * 2, 0, 2.1);
        let SphereMaterial: THREE.Material = new THREE.MeshLambertMaterial({
            side: THREE.DoubleSide,
            color: 0xffffff,
            opacity: 0.5, // 透明度を設定
            transparent: true // 透明度を有効にする        
        });
        let SphereMesh: THREE.Mesh = new THREE.Mesh(addSphereGeometry, SphereMaterial);
        // Sphereオブジェクトを移動する
        SphereMesh.position.x = 0;
        SphereMesh.position.y = 5;
        SphereMesh.position.z = 0;

        this.scene.add(SphereMesh);



        // 風鈴の紙作成
        const col = 5;
        const row = 10;
        const clothSize = 1;
        const dist = clothSize / col; //パーティクル間の距離
        const shape = new CANNON.Particle();
        const particles = [];
        //各パーティクルのCANNON.Bodyを作成  
        for (let i = 0; i <= col; i++) {
            particles.push([]);
            for (let j = 0; j <= row; j++) {
                const positionX = (i - col * 0.5) * dist;
                const positionY = (j - row * 0.5) * dist + 1.1;
                const positionZ = 0;
                const initialPosition = new CANNON.Vec3(positionX, positionY, positionZ);
                const particle = new CANNON.Body({
                    //一番上を固定して他の点を自由に動かすため
                    //現在の行数が総行数と等しい場合、質量（mass）を0
                    mass: j === row ? 0 : 1,
                    shape,
                    position: initialPosition,
                    //パーティクルが布の上端からどれだけ離れているかを示し、これに-0.1を掛けて初期速度を計算
                    //布の下端がより速く動き、上端がほぼ動かない
                    velocity: new CANNON.Vec3(0, 0, -0.1 * (row - j))
                });
                particles[i].push(particle);
                world.addBody(particle);
            }
        }
        //パーティクルがdistの距離を保つように制約するための関数  
        function connect(i1, j1, i2, j2) {
            world.addConstraint(new CANNON.DistanceConstraint(
                particles[i1][j1],
                particles[i2][j2],
                dist,
            ));
        }
        //各パーティクルにCANNON.DistanceConstraint（制約）を設定  
        for (let i = 0; i <= col; i++) {
            for (let j = 0; j <= row; j++) {
                if (i < col) connect(i, j, i + 1, j);
                if (j < row) connect(i, j, i, j + 1);
            }
        }

        const clothGeometry = new THREE.PlaneGeometry(1, 1, col, row);
        const clothMaterial = new THREE.MeshLambertMaterial({
            color: '#00ffff',
            side: THREE.DoubleSide,
            //  wireframe: true,
        });
        const clothMesh = new THREE.Mesh(clothGeometry, clothMaterial);
        clothMesh.position.y = 2;
        clothMesh.rotation.y = 0.5;
        this.scene.add(clothMesh);


        // 風の力を定義
        const windForce = new CANNON.Vec3(0.1, 0, 0);


        // 浮き輪作成
        let TorusGeometry: THREE.BufferGeometry = new THREE.TorusGeometry(0.7, 0.3, 16, 100);
        let TorusMaterial: THREE.Material = new THREE.MeshLambertMaterial({
            side: THREE.DoubleSide,
            color: 0x00ffff,
            opacity: 0.5, // 透明度を設定
            transparent: true // 透明度を有効にする        
        });
        let TorusMaterial1: THREE.Material = new THREE.MeshLambertMaterial({
            side: THREE.DoubleSide,
            color: 0xff00ff,
            opacity: 0.6, // 透明度を設定
            transparent: true // 透明度を有効にする        
        });
        let TorusMaterial2: THREE.Material = new THREE.MeshLambertMaterial({
            side: THREE.DoubleSide,
            color: 0xffff00,
            opacity: 0.7, // 透明度を設定
            transparent: true // 透明度を有効にする        
        });

        let TorusMesh: THREE.Mesh[] = [];

        TorusMesh[0] = new THREE.Mesh(TorusGeometry, TorusMaterial);
        TorusMesh[1] = new THREE.Mesh(TorusGeometry, TorusMaterial1);
        TorusMesh[2] = new THREE.Mesh(TorusGeometry, TorusMaterial2);

        for (let i = 0; i < 3; i++) {
            TorusMesh[i].position.set(i * 3 - 3, 0, i * 3 + 5);
            TorusMesh[i].rotateX(Math.PI / 2);

            this.scene.add(TorusMesh[i]);
        }

        // 浮き輪の物理
        const TorusShape = CANNON.Trimesh.createTorus(0.7, 0.3, 16, 100);
        const TorusBody: CANNON.Body[] = [];

        for (let i = 0; i < 3; i++) {
            TorusBody[i] = new CANNON.Body({
                mass: 0.5
            })
            TorusBody[i].addShape(TorusShape);
            TorusBody[i].position.set(TorusMesh[i].position.x, TorusMesh[i].position.y, TorusMesh[i].position.z);
            TorusBody[i].quaternion.set(TorusMesh[i].quaternion.x, TorusMesh[i].quaternion.y, TorusMesh[i].quaternion.z, TorusMesh[i].quaternion.w);

            world.addBody(TorusBody[i]);
        }



        // 地面作成
        const phongMaterial = new THREE.MeshPhongMaterial({ color: 0x0055ff });
        const planeGeometry = new THREE.PlaneGeometry(25, 25);
        const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial);
        planeMesh.material.side = THREE.DoubleSide; // 両面
        planeMesh.rotateX(-Math.PI / 2);

        this.scene.add(planeMesh);

        const planeShape = new CANNON.Plane()
        const planeBody = new CANNON.Body({ mass: 0 })
        planeBody.addShape(planeShape)
        planeBody.position.set(planeMesh.position.x, planeMesh.position.y, planeMesh.position.z);
        planeBody.quaternion.set(planeMesh.quaternion.x, planeMesh.quaternion.y, planeMesh.quaternion.z, planeMesh.quaternion.w);

        world.addBody(planeBody)



        // 太陽作成
        let SunSize: number = 2;     // Sphereのサイズを決める
        let SunGeometry: THREE.BufferGeometry = new THREE.SphereGeometry(SunSize, 32, 16, 0, Math.PI * 2, 0);
        let SunMaterial: THREE.Material = new THREE.MeshLambertMaterial({
            side: THREE.DoubleSide,
            color: 0xff9900,
        });
        let SunMesh: THREE.Mesh = new THREE.Mesh(SunGeometry, SunMaterial);
        // Sphereオブジェクトを移動する
        SunMesh.position.set(-8, 6, -5);
        this.scene.add(SunMesh);

        // Tweenでコントロールする変数の定義
        let tweeninfo = { scale: 1 };
        //  Tweenでパラメータの更新の際に呼び出される関数
        let updateScale = () => {
            SunMesh.scale.x = tweeninfo.scale;
        }
        // Tweenの作成
        const tween = new TWEEN.Tween(tweeninfo).to({ scale: 1.3 }, 700).easing(TWEEN.Easing.Bounce.Out).onUpdate(updateScale);
        const tweenBack = new TWEEN.Tween(tweeninfo).to({ scale: 1 }, 1000).delay(1000).onUpdate(updateScale);
        tween.chain(tweenBack);
        tweenBack.chain(tween);
        // アニメーションの開始
        tween.start();


        // 日差し作成
        let SunlightGeometry: THREE.BufferGeometry = new THREE.CylinderGeometry(0.05, 0.3, 3, 16);
        let SunlightMaterial: THREE.Material = new THREE.MeshLambertMaterial({
            side: THREE.DoubleSide,
            color: 0xffaa00,
        });
        let SunlightMesh: THREE.Mesh[] = [];

        for (let i = 0; i < 4; i++) {
            SunlightMesh[i] = new THREE.Mesh(SunlightGeometry, SunlightMaterial);

            // オブジェクトを移動する
            SunlightMesh[i].rotation.set(0, 0, Math.PI / 5 * i);
            this.scene.add(SunlightMesh[i]);
        }
        SunlightMesh[0].position.set(-8.5, 1.8, -5);
        SunlightMesh[1].position.set(-6, 2.5, -5);
        SunlightMesh[2].position.set(-4, 4.5, -5);
        SunlightMesh[3].position.set(-3.5, 7, -5);

        // Tweenでコントロールする変数の定義
        let SunlightTweeninfo = { scaleX: 0, scaleY: 0 };
        //  Tweenでパラメータの更新の際に呼び出される関数
        let updateHeight = () => {
            for(let i = 0; i < 4; i++){
                SunlightMesh[i].scale.x = SunlightTweeninfo.scaleX;
                SunlightMesh[i].scale.y = SunlightTweeninfo.scaleY;
            }
        }
        // Tweenの作成
        const SunlightTween = new TWEEN.Tween(SunlightTweeninfo).to({ scaleX: 1.1, scaleY: 1.1 }, 250).delay(800).easing(TWEEN.Easing.Quadratic.Out).onUpdate(updateHeight);
        const SunlightTweenBack = new TWEEN.Tween(SunlightTweeninfo).to({ scaleX: 0, scaleY: 0 }, 500).delay(1000).onUpdate(updateHeight);
        SunlightTween.chain(SunlightTweenBack);
        SunlightTweenBack.chain(SunlightTween);
        // アニメーションの開始
        SunlightTween.start();



        // // グリッド表示
        // const gridHelper = new THREE.GridHelper(10,);
        // this.scene.add(gridHelper);

        // // 軸表示
        // const axesHelper = new THREE.AxesHelper(5);
        // this.scene.add(axesHelper);

        //ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        this.light1 = new THREE.HemisphereLight(0x507fff, 0xd0e040, 0.3);
        this.light1.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light1);


        let update: FrameRequestCallback = (time) => {

            world.fixedStep();

            // 風鈴の紙
            for (let i = 0; i <= col; i++) {
                for (let j = 0; j <= row; j++) {
                    //2Dのパーティクル配列から1DのPlaneGeometryの頂点へのマッピングが必要
                    //そのために2Dのiとjの位置を1Dのインデックスに変換
                    const index = j * (col + 1) + i;
                    const positionAttribute = clothGeometry.attributes.position;
                    //パーティクルの位置の位置を取得
                    //（row-j）でy軸方向の順序を反転させて、PlaneGeometryの頂点の位置にあわせる
                    const position = particles[i][row - j].position;
                    positionAttribute.setXYZ(index, position.x, position.y, position.z);
                    positionAttribute.needsUpdate = true;

                    particles[i][j].applyForce(windForce, particles[i][j].position);
                }
            }

            // 浮き輪
            for (let i = 0; i < 3; i++) {
                TorusBody[i].applyForce(windForce, TorusBody[i].position);
                TorusBody[i].velocity.set(0, 0, Math.random() * -1 - 0.1);
                if (TorusBody[i].position.z < -10) {
                    TorusBody[i].position.set(i * 3 - 3, 0, i * 3 + 5);
                }
                TorusMesh[i].position.set(TorusBody[i].position.x, TorusBody[i].position.y, TorusBody[i].position.z);
            }

            // 風のキーボード操作
            document.addEventListener('keydown', (event) => {
                switch (event.key) {
                    case 'ArrowRight':
                        //右方向
                        windForce.set(5, 0, 0);
                        break;

                    case 'ArrowLeft':
                        //左方向
                        windForce.set(-5, 0, 0);
                        break;

                    case 'ArrowDown':
                        //手前
                        windForce.set(0, 0, 5);
                        break;
                    case 'ArrowUp':
                        //奥
                        windForce.set(0, 0, -5);
                        break;
                }
            });

            document.addEventListener('keyup', (event) => {
                switch (event.key) {
                    case 'ArrowRight':
                        //右方向
                        windForce.set(0, 0, 0);
                        break;

                    case 'ArrowLeft':
                        //左方向
                        windForce.set(0, 0, 0);
                        break;

                    case 'ArrowDown':
                        //手前
                        windForce.set(0, 0, 5);
                        break;

                    case 'ArrowUp':
                        //奥
                        windForce.set(0, 0, 0);
                        break;
                }
            });

            TWEEN.update();


            requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
    }

}

window.addEventListener("DOMContentLoaded", init);

function init() {
    let container = new ThreeJSContainer();

    let viewport = container.createRendererDOM(640, 480, new THREE.Vector3(-3, 3, 9));
    document.body.appendChild(viewport);
}
