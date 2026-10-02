// Contract between the generic <Scene3D> wrapper and each lazily loaded three.js scene module.

export interface SceneView { id: string; label: string }

export interface SceneHandle<P> {
  update(p: P): void;
  setView(id: string): void;
  dispose(): void;
}

export interface SceneModule<P> {
  create(host: HTMLElement, p: P): SceneHandle<P>;
}
