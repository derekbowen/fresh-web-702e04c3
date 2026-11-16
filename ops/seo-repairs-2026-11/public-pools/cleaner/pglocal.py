"""Throwaway local PostgreSQL 16 cluster for the cleaner tests (no network, no production access).

The cluster runs as the unprivileged system user `postgres` (via runuser when started as root), keeps its data
directory under /tmp, listens only on a Unix socket in that directory on a non-default port, and is stopped and
deleted by stop().
"""
import os
import shutil
import subprocess
import tempfile

PGBIN = "/usr/lib/postgresql/16/bin"
RUN_AS = "postgres"


def _as_user(cmd):
    if os.geteuid() == 0:
        return ["runuser", "-u", RUN_AS, "--"] + cmd
    return cmd


class Cluster:
    def __init__(self, port=55432):
        self.port = port
        self.root = tempfile.mkdtemp(prefix="pp-cleaner-pg-", dir="/tmp")
        self.data = os.path.join(self.root, "data")
        self.sock = self.root
        self.work = os.path.join(self.root, "work")
        os.makedirs(self.work)
        if os.geteuid() == 0:
            shutil.chown(self.root, RUN_AS, RUN_AS)
            shutil.chown(self.work, RUN_AS, RUN_AS)
        os.chmod(self.root, 0o755)

    def start(self):
        subprocess.run(_as_user([f"{PGBIN}/initdb", "-D", self.data, "-U", "postgres", "--auth=trust",
                                 "--encoding=UTF8", "--locale=C.UTF-8"]), check=True, capture_output=True)
        subprocess.run(_as_user([f"{PGBIN}/pg_ctl", "-D", self.data, "-l", os.path.join(self.root, "server.log"),
                                 "-o", f"-p {self.port} -k {self.sock} -c listen_addresses=''", "-w", "start"]),
                       check=True, capture_output=True)
        return self

    def stop(self, remove=True):
        subprocess.run(_as_user([f"{PGBIN}/pg_ctl", "-D", self.data, "-m", "fast", "-w", "stop"]),
                       capture_output=True)
        if remove:
            shutil.rmtree(self.root, ignore_errors=True)

    def psql(self, db, args, stdin=None, cwd=None, check=False):
        cmd = _as_user([f"{PGBIN}/psql", "-X", "-q", "-h", self.sock, "-p", str(self.port), "-U", "postgres", "-d", db]
                       + list(args))
        r = subprocess.run(cmd, input=stdin, capture_output=True, text=True, cwd=cwd or self.work)
        if check and r.returncode != 0:
            raise RuntimeError(f"psql failed ({r.returncode}): {' '.join(args)}\n{r.stderr[-4000:]}")
        return r

    def sql(self, db, text, check=True):
        """Run SQL text (ON_ERROR_STOP) and return stdout (unaligned, tuples only, field separator \\x1f)."""
        r = self.psql(db, ["-v", "ON_ERROR_STOP=1", "-A", "-t", "-F", "\x1f", "-R", "\x1e"], stdin=text, check=check)
        return r

    def rows(self, db, text):
        out = self.sql(db, text).stdout
        if out.endswith("\n"):      # psql ends the output (not each record) with one newline
            out = out[:-1]
        return [rec.split("\x1f") for rec in out.split("\x1e") if rec != ""]

    def createdb(self, name):
        self.psql("postgres", ["-c", f"create database {name}"], check=True)

    def dropdb(self, name):
        self.psql("postgres", ["-c", f"drop database if exists {name}"], check=True)

    def copy_in(self, path, name=None):
        """Copy a file into the work dir (readable by the cluster user); returns its new path."""
        dst = os.path.join(self.work, name or os.path.basename(path))
        shutil.copyfile(path, dst)
        if os.geteuid() == 0:
            shutil.chown(dst, RUN_AS, RUN_AS)
        return dst
