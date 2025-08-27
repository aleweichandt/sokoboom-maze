import type { Template } from "./types";

const rotateClockwise = (
  template: Template,
) => {
  const n = template.length;
  
  // Transpose the matrix
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      [template[i][j], template[j][i]] = [template[j][i], template[i][j]];
    }
  }
  
  // Reverse each row
  for (let i = 0; i < n; i++) {
    template[i].reverse();
  }
}

const rotateTemplate = (
  template: Template,
  times: number = 0,
) => {
  for (let i = 0; i < times; i++) {
    rotateClockwise(template)
  }
}

export default rotateTemplate