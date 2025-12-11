import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { requestService } from "@/lib/api"
import { toast } from "sonner"

// Hook para obtener la lista de solicitudes con paginación y filtros
export function useRequests(pagination: any, filters: any) {
  const { pageIndex, pageSize } = pagination
  
  return useQuery({
    queryKey: ["requests", pageIndex, pageSize, filters],
    queryFn: () => requestService.getAll({
      skip: pageIndex * pageSize,
      limit: pageSize,
      ...filters
    }),
    placeholderData: (previousData) => previousData,
  })
}

// Hook para la mutación de actualizar estado
export function useUpdateRequestStatus() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => requestService.updateStatus(id, data),
        onSuccess: () => {
            toast.success("Estatus actualizado correctamente")
            // Invalidar la query de 'requests' para que la tabla se refresque
            queryClient.invalidateQueries({ queryKey: ["requests"] })
        },
        onError: () => {
            toast.error("Error al actualizar el estatus")
        }
    })
}