export function reflectVelocity(vx, vy, nx, ny) {
    const dot = vx * nx + vy * ny;
    return {
        vx: vx - 2 * dot * nx,
        vy: vy - 2 * dot * ny
    };
}
