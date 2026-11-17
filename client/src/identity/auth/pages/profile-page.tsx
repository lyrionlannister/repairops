import { useEffect } from "react";
import { PageShell } from "@common/components/page-shell/page-shell";
import { useMe } from "../hooks/use-me";
import { ProfileCard } from "../components/profile-card";

export const ProfilePage: React.FC = () => {
  const { me, loading, fetchMe } = useMe();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <PageShell title="Mi perfil" description="Tus datos de usuario.">
      {loading && !me ? (
        <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando perfil...</div>
      ) : (
        me && <ProfileCard me={me} />
      )}
    </PageShell>
  );
};
