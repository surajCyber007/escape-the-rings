export function isInGap(angle, start, size) {
    const end = (start + size) % (Math.PI * 2);
    if (start < end) {
      return angle >= start && angle <= end;
    }
    return angle >= start || angle <= end;
  }
  