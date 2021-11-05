declare module "cubic-hermite" {
    export function derivative(p0, v0, p1, v1, t, result?): any;
    function hermite(p0, v0, p1, v1, t, result?): any;
    export default hermite;
}

declare module "*.png";