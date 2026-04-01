import json
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

import tkinter as tk
from tkinter import messagebox, ttk

SCRIPT_DIR = Path(__file__).resolve().parent
EVENTS_PATH = SCRIPT_DIR / "events.json"

DIAS = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"]


def backup_events_file() -> Path:
    if not EVENTS_PATH.exists():
        raise FileNotFoundError(f"Arquivo nao encontrado: {EVENTS_PATH}")
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = EVENTS_PATH.with_name(f"events_backup_{ts}.json")
    shutil.copy2(EVENTS_PATH, backup_path)
    return backup_path


def load_events() -> dict:
    if not EVENTS_PATH.exists():
        return {dia: [] for dia in DIAS}

    data = json.loads(EVENTS_PATH.read_text(encoding="utf-8"))
    for dia in DIAS:
        data.setdefault(dia, [])
    return data


def save_events(data: dict) -> Path:
    backup_path = backup_events_file()
    normalized = {dia: data.get(dia, []) for dia in DIAS}
    EVENTS_PATH.write_text(
        json.dumps(normalized, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return backup_path


class RadarEventosGUI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("SSRX Radar - Gestao de Eventos")
        self.geometry("980x620")
        self.configure(bg="#111111")
        self.resizable(True, True)

        self.data = load_events()
        self.selected_dia = None
        self.selected_index = None

        self.var_dia = tk.StringVar(value=DIAS[0])
        self.var_evento = tk.StringVar()
        self.var_tipo = tk.StringVar()
        self.var_hora = tk.StringVar()
        self.var_duracao = tk.StringVar(value="30")

        self._setup_styles()
        self._build_ui()
        self._render_lista()

    def _setup_styles(self):
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure("TLabel", background="#111111", foreground="#F3F4F6", font=("Segoe UI", 10))
        style.configure("Header.TLabel", background="#111111", foreground="#FACC15", font=("Segoe UI", 13, "bold"))
        style.configure("TButton", font=("Segoe UI", 10), padding=6)
        style.configure("Primary.TButton", background="#22C55E", foreground="#0B0B0B")
        style.map("Primary.TButton", background=[("active", "#4ADE80")])
        style.configure("Danger.TButton", background="#EF4444", foreground="#F9FAFB")
        style.map("Danger.TButton", background=[("active", "#F87171")])

    def _build_ui(self):
        header = tk.Frame(self, bg="#111111")
        header.pack(fill="x", padx=16, pady=(12, 8))
        ttk.Label(header, text="SSRX Event Radar - Painel de Manutencao", style="Header.TLabel").pack(anchor="w")
        ttk.Label(
            header,
            text="Cadastro, edicao e exclusao de eventos com backup automatico do events.json.",
        ).pack(anchor="w", pady=(2, 0))

        body = tk.Frame(self, bg="#111111")
        body.pack(fill="both", expand=True, padx=16, pady=8)

        left = tk.LabelFrame(body, text=" Dados do evento ", bg="#111111", fg="#F3F4F6")
        left.pack(side="left", fill="y", padx=(0, 10))

        ttk.Label(left, text="Dia:").pack(anchor="w", padx=8, pady=(10, 2))
        ttk.Combobox(left, values=DIAS, state="readonly", textvariable=self.var_dia).pack(fill="x", padx=8)

        ttk.Label(left, text="Evento:").pack(anchor="w", padx=8, pady=(10, 2))
        ttk.Entry(left, textvariable=self.var_evento).pack(fill="x", padx=8)

        ttk.Label(left, text="Tipo / Fase:").pack(anchor="w", padx=8, pady=(10, 2))
        ttk.Entry(left, textvariable=self.var_tipo).pack(fill="x", padx=8)

        ttk.Label(left, text="Hora (HH:MM):").pack(anchor="w", padx=8, pady=(10, 2))
        ttk.Entry(left, textvariable=self.var_hora).pack(fill="x", padx=8)

        ttk.Label(left, text="Duracao (min):").pack(anchor="w", padx=8, pady=(10, 2))
        ttk.Entry(left, textvariable=self.var_duracao).pack(fill="x", padx=8)

        actions = tk.Frame(left, bg="#111111")
        actions.pack(fill="x", padx=8, pady=12)
        ttk.Button(actions, text="Adicionar", style="Primary.TButton", command=self._on_add).pack(fill="x")
        ttk.Button(actions, text="Salvar edicao", command=self._on_update).pack(fill="x", pady=6)
        ttk.Button(actions, text="Excluir selecionado", style="Danger.TButton", command=self._on_delete).pack(fill="x")
        ttk.Button(actions, text="Limpar campos", command=self._clear_form).pack(fill="x", pady=(6, 0))
        ttk.Button(actions, text="Publicar no GitHub", command=self._on_publish).pack(fill="x", pady=(10, 0))

        right = tk.LabelFrame(body, text=" Eventos cadastrados ", bg="#111111", fg="#F3F4F6")
        right.pack(side="left", fill="both", expand=True)

        columns = ("dia", "hora", "evento", "tipo", "duracao")
        self.tree = ttk.Treeview(right, columns=columns, show="headings", height=24)
        self.tree.heading("dia", text="Dia")
        self.tree.heading("hora", text="Hora")
        self.tree.heading("evento", text="Evento")
        self.tree.heading("tipo", text="Tipo")
        self.tree.heading("duracao", text="Duracao")
        self.tree.column("dia", width=100, anchor="center")
        self.tree.column("hora", width=80, anchor="center")
        self.tree.column("evento", width=260)
        self.tree.column("tipo", width=180)
        self.tree.column("duracao", width=90, anchor="center")
        self.tree.pack(fill="both", expand=True, padx=8, pady=8)
        self.tree.bind("<<TreeviewSelect>>", self._on_select_item)

        self.status_label = tk.Label(
            self,
            text="Pronto para manutencao do events.json",
            bg="#111111",
            fg="#9CA3AF",
            anchor="w",
        )
        self.status_label.pack(fill="x", padx=16, pady=(2, 10))

    def _set_status(self, text: str, error: bool = False):
        self.status_label.config(text=text, fg="#FCA5A5" if error else "#9CA3AF")

    def _validate_form(self):
        dia = self.var_dia.get().strip()
        evento = self.var_evento.get().strip()
        tipo = self.var_tipo.get().strip()
        hora = self.var_hora.get().strip()
        duracao_text = self.var_duracao.get().strip()

        if dia not in DIAS:
            raise ValueError("Dia invalido.")
        if not evento:
            raise ValueError("Informe o nome do evento.")
        if not tipo:
            raise ValueError("Informe o tipo/fase.")
        if len(hora) != 5 or hora[2] != ":":
            raise ValueError("Hora invalida. Use HH:MM.")

        hh, mm = hora.split(":")
        if not (hh.isdigit() and mm.isdigit()):
            raise ValueError("Hora invalida. Use HH:MM.")
        hhn = int(hh)
        mmn = int(mm)
        if hhn < 0 or hhn > 23 or mmn < 0 or mmn > 59:
            raise ValueError("Hora fora do intervalo valido.")

        if not duracao_text.isdigit():
            raise ValueError("Duracao deve ser um numero inteiro.")
        duracao = int(duracao_text)
        if duracao <= 0:
            raise ValueError("Duracao deve ser maior que zero.")

        return dia, evento, tipo, f"{hhn:02d}:{mmn:02d}", duracao

    def _event_item(self, dia: str, evento: str, tipo: str, hora: str, duracao: int):
        return {"evento": evento, "tipo": tipo, "hora": hora, "duracao": duracao}

    def _persist(self, success_text: str):
        backup = save_events(self.data)
        self._render_lista()
        self._set_status(f"{success_text} (backup: {backup.name})")

    def _on_add(self):
        try:
            dia, evento, tipo, hora, duracao = self._validate_form()
            self.data.setdefault(dia, []).append(self._event_item(dia, evento, tipo, hora, duracao))
            self._persist("Evento adicionado com sucesso")
            self._clear_form()
        except Exception as exc:
            messagebox.showerror("Erro", str(exc))
            self._set_status(str(exc), error=True)

    def _on_update(self):
        if self.selected_dia is None or self.selected_index is None:
            messagebox.showwarning("Aviso", "Selecione um evento na lista para editar.")
            return
        try:
            dia, evento, tipo, hora, duracao = self._validate_form()
            old_dia = self.selected_dia
            old_idx = self.selected_index
            old_item = self.data[old_dia][old_idx]

            self.data[old_dia].pop(old_idx)
            self.data.setdefault(dia, []).append(self._event_item(dia, evento, tipo, hora, duracao))

            self._persist(
                f"Evento atualizado: {old_item['evento']} ({old_item['tipo']})"
            )
            self.selected_dia = None
            self.selected_index = None
            self._clear_form()
        except Exception as exc:
            messagebox.showerror("Erro", str(exc))
            self._set_status(str(exc), error=True)

    def _on_delete(self):
        if self.selected_dia is None or self.selected_index is None:
            messagebox.showwarning("Aviso", "Selecione um evento na lista para excluir.")
            return

        item = self.data[self.selected_dia][self.selected_index]
        ok = messagebox.askyesno(
            "Confirmar exclusao",
            f"Excluir '{item['evento']}' ({item['tipo']}) de {self.selected_dia}?",
        )
        if not ok:
            return

        self.data[self.selected_dia].pop(self.selected_index)
        self._persist("Evento removido com sucesso")
        self.selected_dia = None
        self.selected_index = None
        self._clear_form()

    def _clear_form(self):
        self.var_evento.set("")
        self.var_tipo.set("")
        self.var_hora.set("")
        self.var_duracao.set("30")

    def _run_git(self, *args):
        return subprocess.run(
            ["git", *args],
            cwd=SCRIPT_DIR,
            capture_output=True,
            text=True,
        )

    def _on_publish(self):
        ok = messagebox.askyesno(
            "Confirmar publicacao",
            "Deseja publicar agora?\n\nEsse processo executa:\n- git add events.json\n- git commit\n- git push",
        )
        if not ok:
            return

        try:
            check_repo = self._run_git("rev-parse", "--is-inside-work-tree")
            if check_repo.returncode != 0:
                raise RuntimeError("Pasta atual nao e um repositorio git.")

            add_result = self._run_git("add", "events.json")
            if add_result.returncode != 0:
                raise RuntimeError(f"Falha no git add:\n{add_result.stderr.strip()}")

            diff_result = self._run_git("diff", "--cached", "--quiet")
            if diff_result.returncode == 0:
                messagebox.showinfo("Publicacao", "Sem alteracoes em events.json para publicar.")
                self._set_status("Sem alteracoes para commit.")
                return
            if diff_result.returncode not in (0, 1):
                raise RuntimeError(f"Falha ao verificar alteracoes:\n{diff_result.stderr.strip()}")

            ts = datetime.now().strftime("%Y-%m-%d %H:%M")
            commit_msg = f"chore(events): atualiza agenda SSRX - {ts}"
            commit_result = self._run_git("commit", "-m", commit_msg)
            if commit_result.returncode != 0:
                raise RuntimeError(f"Falha no git commit:\n{commit_result.stderr.strip()}")

            push_result = self._run_git("push")
            if push_result.returncode != 0:
                raise RuntimeError(f"Falha no git push:\n{push_result.stderr.strip()}")

            messagebox.showinfo("Sucesso", "Publicacao concluida com sucesso no GitHub.")
            self._set_status("Publicacao concluida com sucesso.")
        except Exception as exc:
            messagebox.showerror("Erro ao publicar", str(exc))
            self._set_status(f"Falha na publicacao: {exc}", error=True)

    def _render_lista(self):
        for item in self.tree.get_children():
            self.tree.delete(item)

        for dia in DIAS:
            eventos = self.data.get(dia, [])
            indexed = list(enumerate(eventos))
            indexed_sorted = sorted(indexed, key=lambda pair: pair[1].get("hora", "99:99"))
            for original_idx, e in indexed_sorted:
                tree_id = f"{dia}|{original_idx}"
                self.tree.insert(
                    "",
                    "end",
                    iid=tree_id,
                    values=(dia, e.get("hora", ""), e.get("evento", ""), e.get("tipo", ""), e.get("duracao", "")),
                )

        self._set_status("Lista atualizada.")

    def _on_select_item(self, _event):
        selected = self.tree.selection()
        if not selected:
            return

        tree_id = selected[0]
        dia, idx_txt = tree_id.split("|")
        real_idx = int(idx_txt)
        eventos = self.data.get(dia, [])
        if real_idx >= len(eventos):
            return

        target = eventos[real_idx]
        self.selected_dia = dia
        self.selected_index = real_idx

        self.var_dia.set(dia)
        self.var_evento.set(target.get("evento", ""))
        self.var_tipo.set(target.get("tipo", ""))
        self.var_hora.set(target.get("hora", ""))
        self.var_duracao.set(str(target.get("duracao", 30)))
        self._set_status(f"Selecionado: {target.get('evento', '')} ({dia})")


if __name__ == "__main__":
    app = RadarEventosGUI()
    app.mainloop()
