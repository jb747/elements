"use client"
import { useFormContext } from "react-hook-form"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./shadcn/otp-input"
import { HeadlessInputProps } from "../../../../types"

export const DefaultPinCodeInput = ({ attributes }: HeadlessInputProps) => {
  const { setValue } = useFormContext()
  const { maxlength, name } = attributes
  const elements = maxlength ?? 6

  const handleInputChange = (v: string) => {
    setValue(name, v)
  }

  return (
    <div
      className={`grid grid-flow-col grid-cols-${maxlength} gap-3 auto-cols-fr rtl:space-x-reverse`}
    >
      <InputOTP
        maxLength={maxlength ?? 6}
        onChange={handleInputChange}
        name={name}
      >
        <InputOTPGroup className="w-full space-x-2">
          {[...Array(elements)].map((_, index) => (
            <InputOTPSlot
              index={index}
              key={index}
              className="text-center px-1.5 py-2.5 h-10 w-11 md:w-14 md:h-12 border border-radius border-solid rounded-border-radius-forms border-forms-border-default bg-forms-bg-default"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}