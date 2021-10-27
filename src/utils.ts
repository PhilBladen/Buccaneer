import { ports } from './port';
import { Mesh, Vector3, DynamicTexture, StandardMaterial, Color3, Texture } from "@babylonjs/core";

declare global {
    interface Window {
        opera:any;
    }
}

const isMobileDevice = function() {
    let check = false;
    (function(a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

const cosineInterpolate = function(startValue, endValue, i) {
    let mu2 = (1 - Math.cos(i * Math.PI)) / 2;
    return (startValue * (1 - mu2) + endValue * mu2);
}

const cosineInterpolateV3D = function(startVector, endVector, i, outputVector) {
    let mu2 = (1 - Math.cos(i * Math.PI)) / 2;
    outputVector.x = (startVector.x * (1 - mu2) + endVector.x * mu2);
    outputVector.y = (startVector.y * (1 - mu2) + endVector.y * mu2);
    outputVector.z = (startVector.z * (1 - mu2) + endVector.z * mu2);
}

const showAxis = function(size, scene) {
    var makeTextPlane = function(text, color, size) {
        var dynamicTexture = new DynamicTexture("DynamicTexture", 50, scene, true);
        dynamicTexture.hasAlpha = true;
        dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
        var plane = Mesh.CreatePlane("TextPlane", size, scene, true);
        let material : StandardMaterial = new StandardMaterial("TextPlaneMaterial", scene);
        material.backFaceCulling = false;
        material.specularColor = new Color3(0, 0, 0);
        material.diffuseTexture = dynamicTexture;
        plane.material = material;
        return plane;
    };

    var axisX = Mesh.CreateLines("axisX", [
        Vector3.Zero(), new Vector3(size, 0, 0), new Vector3(size * 0.95, 0.05 * size, 0),
        new Vector3(size, 0, 0), new Vector3(size * 0.95, -0.05 * size, 0)
    ], scene);
    axisX.color = new Color3(1, 0, 0);
    var xChar = makeTextPlane("X", "red", size / 10);
    xChar.position = new Vector3(0.9 * size, -0.05 * size, 0);
    var axisY = Mesh.CreateLines("axisY", [
        Vector3.Zero(), new Vector3(0, size, 0), new Vector3(-0.05 * size, size * 0.95, 0),
        new Vector3(0, size, 0), new Vector3(0.05 * size, size * 0.95, 0)
    ], scene);
    axisY.color = new Color3(0, 1, 0);
    var yChar = makeTextPlane("Y", "green", size / 10);
    yChar.position = new Vector3(0, 0.9 * size, -0.05 * size);
    var axisZ = Mesh.CreateLines("axisZ", [
        Vector3.Zero(), new Vector3(0, 0, size), new Vector3(0, -0.05 * size, size * 0.95),
        new Vector3(0, 0, size), new Vector3(0, 0.05 * size, size * 0.95)
    ], scene);
    axisZ.color = new Color3(0, 0, 1);
    var zChar = makeTextPlane("Z", "blue", size / 10);
    zChar.position = new Vector3(0, 0.05 * size, 0.9 * size);
};

const isSquareAllowed = function(x, z) {
    if (x >= -2 && x <= 1 && z >= -2 && z <= 1) // Treasure island
        return false;
    if (x >= -11 && x <= -9 && z >= 7 && z <= 10) // Flat island
        return false;
    if (x >= 8 && x <= 10 && z >= -11 && z <= -8) // Pirate island
        return false;
    for (let port of ports) {
        if (x == port.portLocation.x && z == port.portLocation.z)
            return true;
    }
    if (x < -12 || z < -12 || x > 11 || z > 11) // Border
        return false;
    return true;
}

let splashTexture = null;
const getSplashMaterial = function(scene) {
    // if (splashMaterial !== null)
    // return splashMaterial;

    if (splashTexture === null) {
        splashTexture = new Texture("assets/splash.png", scene);
        splashTexture.hasAlpha = true;
    }

    let splashMaterial = new StandardMaterial("", scene);
    splashMaterial.diffuseTexture = splashTexture;
    splashMaterial.useAlphaFromDiffuseTexture = true;
    splashMaterial.useSpecularOverAlpha = true;
    // splashMaterial.transparencyMode = Material.MATERIAL_ALPHATESTANDBLEND;
    splashMaterial.specularColor = new Color3(0.0, 0.0, 0.0);

    return splashMaterial;
}

/**
 * Generates a random integer from 0 to max inclusive.
 */
function randomInt(max : number) : number {
    return Math.floor(Math.random() * (max + 1));
}

export {
    isMobileDevice,
    cosineInterpolate,
    cosineInterpolateV3D,
    showAxis,
    isSquareAllowed,
    getSplashMaterial,
    randomInt,
}