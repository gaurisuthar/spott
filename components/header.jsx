import React from 'react';
import Image from "next/image";
import Link from "next/link";
const Header = () => {
  return (
    <>
    <nav className='fixed left-0 top-0 right-0 bg-background/80 backdrop-blur-xl z-20 border-b'>
        <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
            <Link href={"/"} className="flex items-center">
            <Image src="/spott.png" alt="spott logo" width={120} height={40} className='w-auto h-11' priority/>
            </Link>
        </div>
    </nav>
    </>
  )
}
//
export default Header