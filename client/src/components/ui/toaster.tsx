import { useToast } from "@/hooks/use-toast"
import {
  Toast, ToastClose, ToastDescription, ToastProvider,
  ToastTitle, ToastViewport, ToastAction, getToastIcon,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <Toast key={id} variant={variant as any} {...props}>
          {/* Icon slot */}
          {getToastIcon(variant as string)}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
            {action && (
              <div className="mt-1.5">
                <ToastAction altText="Action" asChild>
                  {action}
                </ToastAction>
              </div>
            )}
          </div>

          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
