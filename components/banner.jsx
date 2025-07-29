import React from 'react';

const Banner = ({ name, childStyles, parentStyles }) => (
    <div className={`relative w-full flex items-center justify-start z-0 overflow-hidden nft-gradient  ${parentStyles}`}>
    {/* Actual Banner Text */}
    <div className={`z-10 text-white font-bold text-5xl sm:text-4xl leading-relaxed max-w-3xl ml-16 sm:ml-10 ${childStyles}`}>
      {name}
    </div>
    <div className="absolute w-48 h-48 sm:w-32 sm:h-32 rounded-full -top-9 -left-16 -z-5 white-bg" />
    <div className="absolute w-72 h-72 sm:w-56 sm:h-56 rounded-full -bottom-24 -right-14 -z-5 white-bg" />
  </div>
);

export default Banner;