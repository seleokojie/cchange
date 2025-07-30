// Type definitions for cChange Climate Visualization
import * as THREE from 'three';

export interface ClimateDataPoint {
    lat: number;
    lon: number;
    delta: number;
}

export interface YearData {
    0: string;  // year
    1: number[]; // data array
}

export interface ApplicationState {
    year: string;
    markers: ClimateDataPoint[];
    data: YearData[];
}

export interface CameraConfig {
    fov: number;
    aspect: number;
    near: number;
    far: number;
}

export interface ControlsConfig {
    minDistance: number;
    maxDistance: number;
    enablePan: boolean;
}

export interface LightConfig {
    color: string;
    intensity: number;
    distance: number;
}

export interface MaterialConfig {
    color: number;
    map?: THREE.Texture;
    bumpMap?: THREE.Texture;
    bumpScale?: number;
    specularMap?: THREE.Texture;
    specular?: THREE.Color;
    transparent?: boolean;
    opacity?: number;
}

export interface ShaderConfig {
    uniforms: { [uniform: string]: THREE.IUniform };
    vertexShader: string;
    fragmentShader: string;
}

// Event handler types
export type EventHandler = (event: Event) => void;
export type ResizeHandler = () => void;
