'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';

const LOGOS = [
  { id: 'mejuri', el: <span className="font-sans font-medium tracking-[0.32em] text-xs sm:text-sm text-zinc-900">MEJURI</span> },
  {
    id: 'doordash',
    el: (
      <div className="flex items-center gap-1.5 text-zinc-900">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M23.071 8.409a6.09 6.09 0 00-5.396-3.228H.584A.589.589 0 00.17 6.184L3.894 9.93a1.752 1.752 0 001.242.516h12.049a1.554 1.554 0 11.031 3.108H8.91a.589.589 0 00-.415 1.003l3.725 3.747a1.75 1.75 0 001.242.516h3.757c4.887 0 8.584-5.225 5.852-10.413" />
        </svg>
        <span className="font-black tracking-widest text-xs sm:text-sm font-sans">DOORDASH</span>
      </div>
    ),
  },
  {
    id: 'mercedes',
    el: (
      <svg viewBox="0 0 100 100" className="w-6 h-6 sm:w-7 sm:h-7 fill-current text-zinc-900">
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" />
        <polygon points="50,7 50,50 43,47" /><polygon points="50,7 50,50 57,47" opacity="0.65" />
        <polygon points="11,72 50,50 46,57" /><polygon points="11,72 50,50 51,43" opacity="0.65" />
        <polygon points="89,72 50,50 54,43" /><polygon points="89,72 50,50 49,57" opacity="0.65" />
      </svg>
    ),
  },
  {
    id: 'disney',
    el: (
      <svg viewBox="0 188 855 380" className="h-6 sm:h-7 w-auto fill-current text-zinc-900">
        <path d="M735.8 365.7 C721.4 369 683.5 370.9 683.5 370.9 L678.7 385.9 C678.7 385.9 697.6 384.3 711.4 385.7 711.4 385.7 715.9 385.2 716.4 390.8 716.6 396 716 401.6 716 401.6 716 401.6 715.7 405 710.9 405.8 705.7 406.7 670.1 408 670.1 408 L664.3 427.5 C664.3 427.5 662.2 432 667 430.7 671.5 429.5 708.8 422.5 713.7 423.5 718.9 424.8 724.7 431.7 723 438.1 721 445.9 683.8 469.7 661.1 468 661.1 468 649.2 468.8 639.1 452.7 629.7 437.4 642.7 408.3 642.7 408.3 642.7 408.3 636.8 394.7 641.1 390.2 641.1 390.2 643.7 387.9 651.1 387.3 L660.2 368.4 C660.2 368.4 649.8 369.1 643.6 361.5 637.8 354.2 637.4 350.9 641.8 348.9 646.5 346.6 689.8 338.7 719.6 339.7 719.6 339.7 730 338.7 738.9 356.7 738.8 356.7 743.2 364 735.8 365.7 Z M623.7 438.3 C619.9 447.3 609.8 456.9 597.3 450.9 584.9 444.9 565.2 404.6 565.2 404.6 565.2 404.6 557.7 389.6 556.3 389.9 556.3 389.9 554.7 387 553.7 403.4 552.7 419.8 553.9 451.7 547.4 456.7 541.2 461.7 533.7 459.7 529.8 453.8 526.3 448 524.8 434.2 526.7 410 529 385.8 534.6 360 541.8 351.9 549 343.9 554.8 349.7 557 351.8 557 351.8 566.6 360.5 582.5 386.1 L585.3 390.8 C585.3 390.8 599.7 415 601.2 414.9 601.2 414.9 602.4 416 603.4 415.2 604.9 414.8 604.3 407 604.3 407 604.3 407 601.3 380.7 588.2 336.1 588.2 336.1 586.2 330.5 587.6 325.3 588.9 320 594.2 322.5 594.2 322.5 594.2 322.5 614.6 332.7 624.4 365.9 634.1 399.4 627.5 429.3 623.7 438.3 Z M523.5 353 C521.8 356.4 520.8 361.3 512.2 362.6 512.2 362.6 429.9 368.2 426 374 426 374 423.1 377.4 427.6 378.4 432.1 379.3 450.7 381.8 459.7 382.3 469.3 382.4 501.7 382.7 513.3 397.2 513.3 397.2 520.2 404.1 519.9 419.7 519.6 435.7 516.8 441.3 510.6 447.1 504.1 452.5 448.3 477.5 412.3 439.1 412.3 439.1 395.7 420.6 418 406.6 418 406.6 434.1 396.9 475 408.3 475 408.3 487.4 412.8 486.8 417.3 486.1 422.1 476.6 427.2 462.8 426.9 449.4 426.5 439.6 420.1 441.5 421.1 443.3 421.8 427.1 413.3 422.1 419.1 417.1 424.4 418.3 427.7 423.2 431 435.7 438.1 484 435.6 498.4 419.6 498.4 419.6 504.1 413.1 495.4 407.8 486.7 402.8 461.8 399.8 452.1 399.3 442.8 398.8 408.2 399.4 403.2 390.2 403.2 390.2 398.2 384 403.7 366.4 409.5 348 449.8 340.9 467.2 339.3 467.2 339.3 515.1 337.6 523.9 347.4 523.8 347.4 525 349.7 523.5 353 Z M387.5 460.9 C381.7 465.2 369.4 463.3 365.9 458.5 362.4 454.2 361.2 437.1 361.9 410.3 362.6 383.2 363.2 349.6 369 344.3 375.2 338.9 379 343.6 381.4 347.3 384 350.9 387.1 354.9 387.8 363.4 388.4 371.9 390.4 416.5 390.4 416.5 390.4 416.5 393 456.7 387.5 460.9 Z M400 317.1 C383.1 322.7 371.5 320.8 361.7 316.6 357.4 324.1 354.9 326.4 351.6 326.9 346.8 327.4 342.5 319.7 341.7 317.2 340.9 315.3 338.6 312.1 341.4 304.5 331.8 295.9 331.1 284.3 332.7 276.5 335.1 267.5 351.3 233.3 400.6 229.3 400.6 229.3 424.7 227.5 428.8 240.4 L429.5 240.4 C429.5 240.4 452.9 240.5 452.4 261.3 452.1 282.2 426.4 308.2 400 317.1 Z M354 270.8 C349 278.8 348.8 283.6 351.1 286.9 356.8 278.2 367.2 264.5 382.5 254.1 370.7 255.1 360.8 260.2 354 270.8 Z M422.1 257.4 C406.6 259.7 382.6 280.5 371.2 297.5 388.7 300.7 419.6 299.5 433.3 271.6 433.2 271.6 439.8 254.3 422.1 257.4 Z M842.9 418.5 C833.6 434.7 807.5 468.5 772.7 460.6 761.2 488.5 751.6 516.6 746.1 558.8 746.1 558.8 744.9 567 738.1 564.1 731.4 561.7 720.2 550.5 718 535 715.6 514.6 724.7 480.1 743.2 440.6 737.8 431.8 734.1 419.2 737.3 401.3 737.3 401.3 742 368.1 775.3 338.1 775.3 338.1 779.3 334.6 781.6 335.7 784.2 336.8 783 347.6 780.9 352.8 778.8 358 763.9 383.8 763.9 383.8 763.9 383.8 754.6 401.2 757.2 414.9 774.7 388 814.5 333.7 839.2 350.8 847.5 356.7 851.3 369.6 851.3 383.5 851.2 395.8 848.3 408.8 842.9 418.5 Z M835.7 375.9 C835.7 375.9 834.3 365.2 823.9 377 814.9 386.9 798.7 405.6 785.6 430.9 799.3 429.4 812.5 421.9 816.5 418.1 823 412.3 838.1 396.7 835.7 375.9 Z M350.2 389.5 C348.3 413.7 339 454.4 273.1 474.5 229.6 487.6 188.5 481.3 166.1 475.6 165.6 484.5 164.6 488.3 163.2 489.8 161.3 491.7 147.1 499.9 139.3 488.3 135.8 482.8 134 472.8 133 463.9 82.6 440.7 59.4 407.3 58.5 405.8 57.4 404.7 45.9 392.7 57.4 378 68.2 364.7 103.5 351.4 135.3 346 136.4 318.8 139.6 298.3 143.4 288.9 148 278 153.8 287.8 158.8 295.2 163 300.7 165.5 324.4 165.7 343.3 186.5 342.3 198.8 343.8 222 348 252.2 353.5 272.4 368.9 270.6 386.4 269.3 403.6 253.5 410.7 247.5 411.2 241.2 411.7 231.4 407.2 231.4 407.2 224.7 404 230.9 401.2 239 397.7 247.8 393.4 245.8 389 245.8 389 242.5 379.4 203.3 372.7 164.3 372.7 164.1 394.2 165.2 429.9 165.7 450.7 193 455.9 213.4 454.9 213.4 454.9 213.4 454.9 313 452.1 316 388.5 319.1 324.8 216.7 263.7 141 244.3 65.4 224.5 22.6 238.3 18.9 240.2 14.9 242.2 18.6 242.8 18.6 242.8 18.6 242.8 22.7 243.4 29.8 245.8 37.3 248.2 31.5 252.1 31.5 252.1 18.6 256.2 4.1 253.6 1.3 247.7 -1.5 241.8 3.2 236.5 8.6 228.9 14 220.9 19.9 221.2 19.9 221.2 113.4 188.8 227.3 247.4 227.3 247.4 334 301.5 352.2 364.9 350.2 389.5 Z M68 386.2 C57.4 391.4 64.7 398.9 64.7 398.9 84.6 420.3 109.1 433.7 132.4 442 135.1 405.1 134.7 392.1 135 373.5 98.6 376 77.6 381.8 68 386.2 Z" />
      </svg>
    ),
  },
  {
    id: 'eightsleep',
    el: (
      <div className="flex items-center gap-1.5 text-zinc-900">
        <svg viewBox="0 0 24 30" className="w-3.5 h-4.5 sm:w-4 sm:h-5 fill-current">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 1C8 1 5 4 5 8C5 10.3 6 12.2 7.5 13.5C5.5 15 4 17.5 4 20.5C4 25.5 7.5 29 12 29C16.5 29 20 25.5 20 20.5C20 17.5 18.5 15 16.5 13.5C18 12.2 19 10.3 19 8C19 4 16 1 12 1ZM12 4.8C13.8 4.8 15.2 6.2 15.2 8C15.2 9.8 13.8 11.2 12 11.2C10.2 11.2 8.8 9.8 8.8 8C8.8 6.2 10.2 4.8 12 4.8ZM12 16.5C14.3 16.5 16.2 18.3 16.2 20.6C16.2 22.9 14.3 24.8 12 24.8C9.7 24.8 7.8 22.9 7.8 20.6C7.8 18.3 9.7 16.5 12 16.5Z" />
          <rect x="0" y="13.2" width="24" height="2" fill="white" />
        </svg>
        <div className="flex flex-col leading-none font-black text-[10px] font-sans">
          <span>EIGHT</span><span>SLEEP</span>
        </div>
      </div>
    ),
  },
  { id: 'atlantic', el: <span className="font-serif italic text-lg sm:text-2xl text-zinc-900">The Atlantic</span> },
];

export default function BrandStatement() {
  const [randomMode, setRandomMode] = useState(false);
  const items = [...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS];

  const Badge = ({
    gif,
    bg,
    className = '',
    style,
    children,
  }: {
    gif: string;
    bg?: string;
    className?: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
  }) => (
    <span
      onClick={() => setRandomMode(!randomMode)}
      className={`inline-flex items-center justify-center align-middle overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95 select-none relative shrink-0 ${className}`}
      style={{
        width: '0.94em',
        height: '0.94em',
        borderRadius: '0.24em',
        background: bg,
        ...style,
      }}
    >
      {randomMode ? <img src={gif} alt="" className="w-full h-full object-cover" /> : children}
    </span>
  );

  return (
    <section className="relative w-full bg-white text-zinc-950 overflow-hidden pt-16 sm:pt-28 pb-20 sm:pb-36 select-none">
      <style>{`
        @keyframes marqueeMove { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-50%, 0, 0); } }
        .marquee-content { display: flex; width: max-content; animation: marqueeMove 18s linear infinite; will-change: transform; }
      `}</style>

      {/* Marquee with non-stop continuous scrolling even on hover */}
      <div className="relative w-full overflow-hidden mb-12 sm:mb-28">
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-36 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-36 bg-gradient-to-l from-white to-transparent z-10" />

        <div className="marquee-content items-center py-2">
          {items.map((logo, idx) => (
            <div key={`${logo.id}-${idx}`} className="flex items-center mx-6 sm:mx-12 opacity-85 hover:opacity-100 transition-opacity">
              {logo.el}
            </div>
          ))}
        </div>
      </div>

      {/* Main Statement - exact 3-line layout scaling smoothly on both laptop and mobile */}
      <div
        className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-12 flex flex-col items-center text-center font-normal tracking-[-0.035em] leading-[1.3] text-zinc-950"
        style={{ fontSize: 'clamp(1.05rem, 5.3vw, 3.85rem)' }}
      >
        {/* Line 1 */}
        <div className="flex items-center justify-center whitespace-nowrap gap-[0.22em] max-w-full">
          <span>finally</span>
          <Badge
            gif="https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3N3FuaWw0aGVvdmxlOHlnN3oxaDg4M2Y1amF1dWJqcnN3a2prcTBoNCZlcD12MV9naWZzX3RyZW5kaW5nJmN0PWc/ytu2GUYbvhz7zShGwS/giphy.gif"
            bg="radial-gradient(circle at 35% 25%, #e3f1fc, #85bfe8)"
            className="shadow-xs"
          >
            <svg viewBox="0 0 100 65" className="w-[66%] h-auto">
              <path
                d="M12 36 C28 40, 58 30, 94 8 C94 8, 56 50, 32 58 C16 63, 7 52, 12 36 Z"
                fill="#f4511e"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="1.2"
              />
            </svg>
          </Badge>
          <span>is the modern video</span>
          <Badge
            gif="https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif"
            className="bg-[#121215] border-t border-white/20 shadow-xs"
          >
            <span className="text-[0.27em] font-black uppercase tracking-tight text-white select-none leading-none">
              CUT
            </span>
          </Badge>
          <span>editor where</span>
        </div>

        {/* Line 2 */}
        <div className="flex items-center justify-center whitespace-nowrap gap-[0.22em] max-w-full mt-[0.14em] sm:mt-2">
          <span>creatives can</span>
          <Badge gif="/images/badges/horse.gif" className="bg-[#3b66f5] shadow-xs">
            <img
              src="/images/badges/horse.gif"
              alt="Horse badge"
              className="w-full h-full object-cover mix-blend-multiply opacity-90"
            />
          </Badge>
          <span>cut remix</span>
          <Badge
            gif="https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif"
            className="bg-black p-[0.04em] shadow-xs"
          >
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                borderRadius: '0.2em',
                background: 'linear-gradient(180deg, #1b264f 0%, #6c1a8e 48%, #ffb400 82%, #00a6ed 100%)',
              }}
            >
              <span className="text-white font-black text-[0.19em] tracking-tight select-none leading-none">
                RENDER
              </span>
            </div>
          </Badge>
          <span>cinematic</span>
        </div>

        {/* Line 3 */}
        <div className="flex items-center justify-center whitespace-nowrap gap-[0.22em] max-w-full mt-[0.14em] sm:mt-2">
          <span>visual stories</span>
          <Badge
            gif="https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif"
            className="bg-[#fafafd] border border-red-500/25 shadow-xs"
          >
            <div className="flex flex-col items-center justify-center text-[#e01e1e] font-black text-[0.165em] leading-[0.82] select-none">
              <span className="opacity-70 -mt-[0.05em]">REC 24FPS</span>
              <span>4K UHD</span>
              <span>4K UHD</span>
              <span className="opacity-70 -mb-[0.05em]">REC 24FPS</span>
            </div>
          </Badge>
          <span>right on timeline.</span>
        </div>
      </div>
    </section>
  );
}
