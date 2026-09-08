import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCreateMonitor } from "@/lib/queries/monitors";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { MonitorForm } from "./MonitorForm";

/**
 * DALGA 2 — kayıt sonrası hedef değişti.
 *
 * Önce: monitör oluşturulunca listeye dönülüyordu; kullanıcı "Pending"
 * satırına bakıyor, ilk sonucu görmek için bekliyor ve akış kopuyordu.
 * Sonra: doğrudan monitör detayına gidilir — ilk kontrol sonucu (yeşil nokta,
 * yanıt süresi, HTTP kodu) oradadır. W1'in "ilk yeşil" adımı budur.
 *
 * NOT (backend): detay sayfasının anında sonuç gösterebilmesi için API
 * tarafında monitör oluşturma isteği tek seferlik senkron bir kontrol
 * tetiklemeli (bkz. patch/apps/api/README-first-check.md).
 */
export function MonitorCreate() {
  const navigate = useNavigate();
  const mutation = useCreateMonitor();

  return (
    <div>
      <PageHeader
        eyebrow="New monitor"
        title="Add Monitor"
        description="Paste a URL — everything else has a sensible default."
      />
      <MonitorForm
        loading={mutation.isPending}
        onSubmit={(data) =>
          mutation.mutate(data, {
            onSuccess: (res) => {
              toast.success("Monitor created — running first check");
              const id = res?.monitor?.id;
              navigate(id ? `/dashboard/monitors/${id}` : "/dashboard/monitors");
            },
            onError: (e) =>
              toast.error(e instanceof ApiError ? e.message : "Failed to create monitor"),
          })
        }
      />
      <div className="mt-4 max-w-xl">
        <Button variant="ghost" asChild>
          <Link to="/dashboard/monitors">Cancel</Link>
        </Button>
      </div>
    </div>
  );
}
