import * as cga from "../../../src/";
import {
    BufferGeometry,
    Geometry,
    Line,
    LineDashedMaterial,
    Float32BufferAttribute,
    PointsMaterial,
    Points,
    LineBasicMaterial,
    Mesh,
    Face3,
    DoubleSide,
    MeshBasicMaterial,
    CircleGeometry,
    Quaternion,
    Matrix4
} from "three";
import { clamp } from "../../../src/";
function randomGeo(key) {
    switch (key)
    {
        case "Point":
            return new cga.Point().copy(randomV3());
        case "Line":
            return new cga.Line(randomV3(), randomV3());
        case "Ray":
            return new cga.Ray(randomV3(), randomV3().normalize())
        case "Segment":
            return new cga.Segment(randomV3(), randomV3());
        case "Polyline":
            var vs = [];
            for (let i = 0; i < Math.floor(Math.random() * 100 + 3); i++)
            {
                vs.push(randomV3());
            }
            return new cga.Polyline(vs);
        case "Triangle":
            return new cga.Triangle(randomV3(200), randomV3(200), randomV3(200));

        case "Circle":
            return new cga.Circle(randomV3(), randomV3().normalize(), Math.random() * 60 + 5);

        case "Disk":
            return new cga.Disk(randomV3(), randomV3().normalize(), Math.random() * 60 + 5);

        case "Capsule":
            return new cga.Capsule(randomV3(), randomV3());

    }
}

export function initTestScene(geoKey1, geoKey2, scene) {
    var geo0 = randomGeo(geoKey1);
    var geo1 = randomGeo(geoKey2);;
    var result = geo0["distance" + geoKey2](geo1);
    scene.add(toMesh(geo0));
    scene.add(toMesh(geo1));
    if (result.closests && result.closests.length === 2)
    {
        scene.add(toDisSeg(result.closests))
    }
    // if (geo0 instanceof cga.Point && (geo1 instanceof cga.Circle || geo1 instanceof cga.Disk
    // ))
    // {
    //     // scene.add(toDisSeg([geo0, geo1.center]))
    // }
    return result;
}

export function randomV3(range = 100) {
    return cga.v3(Math.random() * range - range / 2, Math.random() * range, Math.random() * range - range / 3);
}


export function getQuaternionForm2V(v1, v2) {
    var vc1 = v1.clone().normalize();
    var vc2 = v2.clone().normalize();
    var n = vc1
        .clone()
        .cross(vc2)
        .normalize();
    var rq = new Quaternion();
    var angle = clamp(vc1.normalize().dot(vc2.normalize()), -1, 1);
    angle = Math.acos(angle);
    rq.setFromAxisAngle(n, angle);

    return rq;
}

export function toDisSeg(obj, opts) {
    var geometry = new Geometry()
    geometry.vertices.push(...obj)
    var material = new LineDashedMaterial({
        color: 0xff0000,
        dashSize: 1,
        gapSize: 1,
        scale: 1, // 比例越大，虚线越密；反之，虚线越疏
        ...opts
    });
    // debugger
    // Line.computeLineDistances(geometry);//
    var line = new Line(geometry, material);
    line.computeLineDistances();
    return line;
}

export function toMesh(obj, materialOption) {
    var renderObj = null;
    if (obj instanceof cga.Point || obj.isVector3)
    {
        var geometry = new BufferGeometry()
        geometry.setAttribute('position', new Float32BufferAttribute([obj.x, obj.y, obj.z], 3));
        var material = new PointsMaterial({ size: 5, sizeAttenuation: false, color: 0x0ff0f0, alphaTest: 0.9, transparent: true });
        renderObj = new Points(geometry, material);

    } else if (obj instanceof cga.Line)
    {
        var geometry = new Geometry()
        var v1 = obj.direction.clone().multiplyScalar(10000).add(obj.origin);
        var v2 = obj.direction.clone().multiplyScalar(-10000).add(obj.origin);
        geometry.vertices.push(v1, v2);
        var material = new LineBasicMaterial({ color: 0xffff8f });
        renderObj = new Line(geometry, material);

    } else if (obj instanceof cga.Ray)
    {
        var geometry = new Geometry()
        var v1 = obj.direction.clone().multiplyScalar(10000).add(obj.origin);
        geometry.vertices.push(obj.origin, v1);
        var material = new LineBasicMaterial({ color: 0xff8fff });
        renderObj = new Line(geometry, material);
    } else if (obj instanceof cga.Segment)
    {
        var geometry = new Geometry()
        geometry.vertices.push(obj.p0, obj.p1);
        var material = new LineBasicMaterial({ color: 0x8fffff });
        renderObj = new Line(geometry, material);
    } else if (obj instanceof cga.Triangle)
    {
        var geometry = new Geometry()
        geometry.vertices = [...obj];
        geometry.faces.push(new Face3(0, 1, 2))
        var material = new MeshBasicMaterial({ color: 0x8f8fff, side: DoubleSide });
        renderObj = new Mesh(geometry, material);
    }

    else if (obj instanceof cga.Polyline)
    {
        var geometry = new Geometry()
        geometry.vertices.push(...obj);
        var material = new LineBasicMaterial({ color: 0xff8fff });
        renderObj = new Line(geometry, material);
    } else if (obj instanceof cga.Polygon)
    {

    } else if (obj instanceof cga.Circle)
    {
        var geometry = new Geometry()
        var radius = obj.radius;
        for (let i = 0; i <= 128; i++)
        {
            var p = new cga.Vector3();
            p.x = radius * Math.cos(Math.PI / 64 * i);
            p.y = radius * Math.sin(Math.PI / 64 * i);
            geometry.vertices.push(p);
        }
        var quaternion = getQuaternionForm2V(new cga.Vector3(0, 0, 1), obj.normal);
        var mat4 = new Matrix4();
        mat4.makeRotationFromQuaternion(quaternion);
        geometry.applyMatrix(mat4);
        geometry.translate(obj.center.x, obj.center.y, obj.center.z);
        var material = new LineBasicMaterial({ color: 0x8fffff });
        renderObj = new Line(geometry, material);
        renderObj.add(new toMesh(obj.center))
        renderObj.add(new toMesh(new cga.Ray(obj.center, obj.normal)))
    }
    else if (obj instanceof cga.Disk)
    {
        var geometry = new CircleGeometry(obj.radius, 128)
        var material = new MeshBasicMaterial({ color: 0x8f8fff, side: DoubleSide });
        var quaternion = getQuaternionForm2V(new cga.Vector3(0, 0, 1), obj.normal);
        var mat4 = new Matrix4();
        mat4.makeRotationFromQuaternion(quaternion);
        geometry.applyMatrix(mat4);
        geometry.translate(obj.center.x, obj.center.y, obj.center.z);
        renderObj = new Mesh(geometry, material);
        renderObj.add(new toMesh(obj.center))
        renderObj.add(new toMesh(new cga.Ray(obj.center, obj.normal)))
    }

    return renderObj;

}