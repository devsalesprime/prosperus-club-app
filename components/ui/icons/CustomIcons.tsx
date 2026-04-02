import React from 'react';

export interface CustomIconProps {
  size?: number | string;
  className?: string;
}

const defaultSize = 24;

export const IconHome = ({ size = defaultSize, className = '' }: CustomIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10"/>
    <path d="M16.2438 7.75696L13.7688 14.475L7.75781 16.243L9.52581 10.232L16.2438 7.75696Z" stroke="currentColor" strokeWidth="1.922" strokeLinejoin="round"/>
    <path d="M13.7684 14.475L9.52539 10.232L15.5364 8.46399L13.7684 14.475Z" fill="currentColor"/>
    <path d="M5.28125 5.98999L5.98925 6.69699" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round"/>
    <path d="M17.3027 18.01L18.0097 18.718" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round"/>
  </svg>
);

export const IconAgenda = ({ size = defaultSize, className = '' }: CustomIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 15C8.55228 15 9 14.5523 9 14C9 13.4477 8.55228 13 8 13C7.44772 13 7 13.4477 7 14C7 14.5523 7.44772 15 8 15Z" fill="currentColor"/>
  </svg>
);

export const IconProsperus = ({ size = defaultSize, className = '' }: CustomIconProps) => (
  <svg width={size} height={size} viewBox="0 0 19 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M15.74 2.41C14.29 0.88 12.31 0 10.33 0H4.87V3.76C4.26 3.93 3.68 4.21 3.13 4.58C2.47 5.03 1.88 5.6 1.4 6.29C0.49 7.57 0 9.13 0 10.77C0 15.7 4.23 18.28 8.4 18.28C13.82 18.28 18.06 13.87 18.06 8.25C18.06 6.05 17.23 3.98 15.74 2.41ZM8.4 16.3C5.82 16.3 1.98 14.83 1.98 10.77C1.98 9.54 2.34 8.38 3.01 7.43C3.36 6.94 3.77 6.53 4.24 6.22C4.78 5.85 5.37 5.63 5.99 5.54L6.02 5.53C6.19 5.51 6.37 5.5 6.56 5.5C9.42 5.5 10.35 7.83 10.35 8.95C10.35 9.5 10.79 9.94 11.34 9.94C11.89 9.94 12.33 9.5 12.33 8.95C12.33 7.77 11.83 6.47 10.99 5.48C10.28 4.63 8.98 3.61 6.85 3.52V1.98H10.33C13.44 1.98 16.08 4.85 16.08 8.25C16.08 12.76 12.71 16.3 8.4 16.3Z" fill="currentColor"/>
    <path d="M6.84914 8.19996V21.01C6.84914 21.56 6.40914 22 5.85914 22C5.31914 22 4.86914 21.56 4.86914 21.01V8.19996C4.86914 7.65996 5.31914 7.20996 5.85914 7.20996C6.40914 7.20996 6.84914 7.65996 6.84914 8.19996Z" fill="currentColor"/>
    <path d="M8.3693 0.99C8.3693 1.54 7.9293 1.98 7.3793 1.98H2.7693C2.2293 1.98 1.7793 1.54 1.7793 0.99C1.7793 0.45 2.2293 0 2.7693 0H7.3793C7.9293 0 8.3693 0.45 8.3693 0.99Z" fill="currentColor"/>
  </svg>
);

export const IconSocios = ({ size = defaultSize, className = '' }: CustomIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M8.5 22C12.0899 22 15 19.0899 15 15.5C15 11.9101 12.0899 9 8.5 9C4.91015 9 2 11.9101 2 15.5C2 19.0899 4.91015 22 8.5 22Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10"/>
    <path d="M18 14.5C20.35 13.52 22 11.2 22 8.5C22 4.91 19.09 2 15.5 2C12.8 2 10.48 3.65 9.5 6" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round"/>
  </svg>
);

export const IconGaleria = ({ size = defaultSize, className = '' }: CustomIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M20 2H12C10.8954 2 10 2.89543 10 4V16C10 17.1046 10.8954 18 12 18H20C21.1046 18 22 17.1046 22 16V4C22 2.89543 21.1046 2 20 2Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10"/>
    <path d="M7.00022 5.52002L3.16022 7.31002C2.15022 7.78002 1.72022 8.97002 2.19022 9.97002L7.26022 20.84C7.73022 21.85 8.92022 22.28 9.92022 21.81L11.6602 21" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round"/>
    <path d="M22 12L19 9L15 13L13 11L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.5 8C14.3284 8 15 7.32843 15 6.5C15 5.67157 14.3284 5 13.5 5C12.6716 5 12 5.67157 12 6.5C12 7.32843 12.6716 8 13.5 8Z" fill="currentColor"/>
  </svg>
);

export const IconAcademy = ({ size = defaultSize, className = '' }: CustomIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5 5.00002C5 3.89502 5.895 3.00002 6.999 2.99902C7.353 2.99902 7.701 3.09302 8.008 3.27202L20.005 10.27C20.96 10.824 21.285 12.048 20.731 13.004C20.557 13.304 20.308 13.554 20.008 13.728L8.008 20.728C7.054 21.285 5.829 20.963 5.273 20.009C5.094 19.703 5 19.355 5 19V5.00002Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IconNegocios = ({ size = defaultSize, className = '' }: CustomIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M11 16.9399L13 18.9399C13.828 19.7679 15.172 19.7679 16 18.9399C16.828 18.1119 16.828 16.7679 16 15.9399" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.9999 13.94L16.4999 16.44C17.3279 17.268 18.6719 17.268 19.4999 16.44C20.3279 15.612 20.3279 14.268 19.4999 13.44L15.6199 9.56002C14.4489 8.39002 12.5509 8.39002 11.3799 9.56002L10.4999 10.44C9.67191 11.268 8.32791 11.268 7.49991 10.44C6.67191 9.61202 6.67191 8.26802 7.49991 7.44002L10.3099 4.63002C12.1869 2.75802 15.0949 2.40002 17.3699 3.76002L17.8399 4.04002C18.2659 4.29702 18.7719 4.38602 19.2599 4.29002L20.9999 3.94002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 13.94V2.93896H21L22 13.94ZM22 13.94H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 13.9399V2.93994H3L2 13.9399ZM2 13.9399L8.5 20.4399C9.328 21.2679 10.672 21.2679 11.5 20.4399C12.328 19.6119 12.328 18.2679 11.5 17.4399" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 3.93994H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IconIndicacoes = ({ size = defaultSize, className = '' }: CustomIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 12C13.6569 12 15 10.6569 15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 6.99902C20.1046 6.99902 21 6.10359 21 4.99902C21 3.89445 20.1046 2.99902 19 2.99902C17.8954 2.99902 17 3.89445 17 4.99902C17 6.10359 17.8954 6.99902 19 6.99902Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 20.999C6.10457 20.999 7 20.1036 7 18.999C7 17.8945 6.10457 16.999 5 16.999C3.89543 16.999 3 17.8945 3 18.999C3 20.1036 3.89543 20.999 5 20.999Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.63086 15C8.51086 13.87 9.88086 13 12.0009 13C18.0009 13 18.0009 20 18.0009 20" stroke="currentColor" strokeWidth="1.704" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.33 6.47998C21.39 8.05998 22 9.95998 22 12C22 17.52 17.52 22 12 22C11.31 22 10.64 21.93 10 21.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.66 17.51C2.61 15.93 2 14.04 2 12C2 6.48 6.48 2 12 2C12.69 2 13.36 2.07 14 2.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IconChat = ({ size = defaultSize, className = '' }: CustomIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M21.256 18.323C22.234 16.565 22.248 14.519 21.295 12.751C19.542 9.49902 15.079 8.09302 11.326 9.61202C7.57303 11.131 5.95203 14.999 7.70403 18.251C9.45703 21.503 13.92 22.909 17.673 21.39C17.936 21.304 18.221 21.283 18.497 21.33L21.057 21.979C21.169 22.005 21.287 22.008 21.4 21.987C21.806 21.915 22.067 21.571 21.984 21.219L21.185 19.081C21.121 18.828 21.145 18.564 21.255 18.322" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.4205 6C15.7305 4.55 14.4405 3.32 12.6705 2.61C8.92054 1.09 4.46054 2.5 2.70054 5.75C1.75054 7.52 1.77054 9.56999 2.74054 11.32C2.85054 11.56 2.88054 11.83 2.81054 12.08L2.01054 14.22C1.93054 14.57 2.19054 14.92 2.60054 14.99C2.71054 15.01 2.83054 15 2.94054 14.98L4.00054 14.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.4941 15.5H10.5041" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.4941 15.5H14.5041" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.4941 15.5H18.5041" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IconEventos = ({ size = defaultSize, className = '' }: CustomIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M2 2V22" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round"/>
    <path d="M2 16H22L16 10L22 4H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
