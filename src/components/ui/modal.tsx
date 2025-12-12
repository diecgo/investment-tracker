import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "./button"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className={cn("relative w-full max-w-lg rounded-xl border bg-white p-6 shadow-lg text-slate-950", className)}>
                <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={onClose}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </div>
                </div>
                <div>
                    {children}
                </div>
            </div>
        </div>
    )
}
