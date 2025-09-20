import Image from "next/image"

/**
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 */
export default function ApplicationLogo({ size = "md" }) {
    let className = ""

    if (size === "sm") className = "w-24 h-auto"   // kecil → dashboard
    if (size === "md") className = "w-36 h-auto"   // default
    if (size === "lg") className = "w-56 h-auto"   // besar → login page

    return (
        <Image 
            src="/bulog.svg" 
            alt="Bulog Logo" 
            width={200}
            height={200}
            priority
            className={className}
        />
    )
}
