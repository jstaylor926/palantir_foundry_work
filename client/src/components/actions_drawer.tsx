import * as React from "react";
import {
    Card, CardHeader, CardContent, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Snackbar, Alert
} from "@mui/material";
import { useDAIA } from "../store/useDAIA";

export default function ActionsDrawer({ caseId, modelId: propModelId }: { caseId?: string; modelId?: string }) {
    const s = useDAIA();
    const [snack, setSnack] = React.useState<{open:boolean; msg:string; sev:"success"|"info"|"error"}>({open:false,msg:"",sev:"success"});

    // Dialog state
    const [rvOpen, setRvOpen] = React.useState(false);
    const [rv, setRv] = React.useState({ modelId: propModelId ?? "", modelVersionId: "", scheduled: "", note: "" });

    const [apOpen, setApOpen] = React.useState(false);
    const [ap, setAp] = React.useState({ modelId: propModelId ?? "", gate: "QG1", decision: "Passed", note: "" });

    const [rkOpen, setRkOpen] = React.useState(false);
    const [rk, setRk] = React.useState({ actionId: "", severity: "HIGH", description: "" });

    const [upOpen, setUpOpen] = React.useState(false);
    const [up, setUp] = React.useState({ actionId: "", modelId: propModelId ?? "", uri: "", type: "doc", note: "" });

    const [ccOpen, setCcOpen] = React.useState(false);
    const [cc, setCc] = React.useState({ modelId: propModelId ?? "", note: "" });

    // Helpers
    const ok = (msg: string) => setSnack({ open: true, msg, sev: "success" });

    return (
        <Card>
            <CardHeader title="Actions" />
            <CardContent>
                <Stack spacing={1.2}>
                    <Button onClick={() => setRvOpen(true)}>Request Validation</Button>
                    <Button onClick={() => setApOpen(true)}>Approve Milestone</Button>
                    <Button onClick={() => setRkOpen(true)}>Flag Risk</Button>
                    <Button onClick={() => setUpOpen(true)}>Upload Evidence</Button>
                    <Button onClick={() => setCcOpen(true)}>Close Case</Button>
                </Stack>
            </CardContent>

            {/* Request Validation */}
            <Dialog open={rvOpen} onClose={() => setRvOpen(false)}>
                <DialogTitle>Request Validation</DialogTitle>
                <DialogContent>
                    <TextField fullWidth sx={{ mt:1 }} label="Model ID" value={rv.modelId} onChange={e=>setRv({...rv, modelId:e.target.value})} />
                    <TextField fullWidth sx={{ mt:1 }} label="Model Version (optional)" value={rv.modelVersionId} onChange={e=>setRv({...rv, modelVersionId:e.target.value})} />
                    <TextField fullWidth sx={{ mt:1 }} type="date" label="Scheduled (optional)" InputLabelProps={{shrink:true}} value={rv.scheduled} onChange={e=>setRv({...rv, scheduled:e.target.value})} />
                    <TextField fullWidth sx={{ mt:1 }} label="Note" value={rv.note} onChange={e=>setRv({...rv, note:e.target.value})} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={()=>setRvOpen(false)}>Cancel</Button>
                    <Button onClick={() => { s.requestValidation(rv); setRvOpen(false); ok("Validation requested"); }}>Run</Button>
                </DialogActions>
            </Dialog>

            {/* Approve Milestone */}
            <Dialog open={apOpen} onClose={()=>setApOpen(false)}>
                <DialogTitle>Approve Milestone</DialogTitle>
                <DialogContent>
                    <TextField fullWidth sx={{ mt:1 }} label="Model ID" value={ap.modelId} onChange={e=>setAp({...ap, modelId:e.target.value})} />
                    <TextField select fullWidth sx={{ mt:1 }} label="Gate" value={ap.gate} onChange={e=>setAp({...ap, gate:e.target.value})}>
                        {["QG0","QG1","QG2"].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                    </TextField>
                    <TextField select fullWidth sx={{ mt:1 }} label="Decision" value={ap.decision} onChange={e=>setAp({...ap, decision:e.target.value})}>
                        {["Passed","KO"].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </TextField>
                    <TextField fullWidth sx={{ mt:1 }} label="Note" value={ap.note} onChange={e=>setAp({...ap, note:e.target.value})} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={()=>setApOpen(false)}>Cancel</Button>
                    <Button onClick={() => { s.approveMilestone(ap as any); setApOpen(false); ok("Milestone decision recorded"); }}>Run</Button>
                </DialogActions>
            </Dialog>

            {/* Flag Risk */}
            <Dialog open={rkOpen} onClose={()=>setRkOpen(false)}>
                <DialogTitle>Flag Risk</DialogTitle>
                <DialogContent>
                    <TextField fullWidth sx={{ mt:1 }} label="Action ID" value={rk.actionId} onChange={e=>setRk({...rk, actionId:e.target.value})} />
                    <TextField select fullWidth sx={{ mt:1 }} label="Severity" value={rk.severity} onChange={e=>setRk({...rk, severity:e.target.value})}>
                        {["HIGH","MEDIUM","LOW"].map(x => <MenuItem key={x} value={x}>{x}</MenuItem>)}
                    </TextField>
                    <TextField fullWidth sx={{ mt:1 }} label="Description" value={rk.description} onChange={e=>setRk({...rk, description:e.target.value})} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={()=>setRkOpen(false)}>Cancel</Button>
                    <Button onClick={() => { s.flagRisk(rk as any); setRkOpen(false); ok("Risk flagged"); }}>Run</Button>
                </DialogActions>
            </Dialog>

            {/* Upload Evidence */}
            <Dialog open={upOpen} onClose={()=>setUpOpen(false)}>
                <DialogTitle>Upload Evidence</DialogTitle>
                <DialogContent>
                    <TextField fullWidth sx={{ mt:1 }} label="Action ID (optional)" value={up.actionId} onChange={e=>setUp({...up, actionId:e.target.value})} />
                    <TextField fullWidth sx={{ mt:1 }} label="Model ID (optional)" value={up.modelId} onChange={e=>setUp({...up, modelId:e.target.value})} />
                    <TextField fullWidth sx={{ mt:1 }} label="URI" value={up.uri} onChange={e=>setUp({...up, uri:e.target.value})} />
                    <TextField fullWidth sx={{ mt:1 }} label="Type" value={up.type} onChange={e=>setUp({...up, type:e.target.value})} />
                    <TextField fullWidth sx={{ mt:1 }} label="Note" value={up.note} onChange={e=>setUp({...up, note:e.target.value})} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={()=>setUpOpen(false)}>Cancel</Button>
                    <Button onClick={() => { s.uploadEvidence(up as any); setUpOpen(false); ok("Evidence recorded"); }}>Run</Button>
                </DialogActions>
            </Dialog>

            {/* Close Case */}
            <Dialog open={ccOpen} onClose={()=>setCcOpen(false)}>
                <DialogTitle>Close Case</DialogTitle>
                <DialogContent>
                    <TextField fullWidth sx={{ mt:1 }} label="Model ID" value={cc.modelId} onChange={e=>setCc({...cc, modelId:e.target.value})} />
                    <TextField fullWidth sx={{ mt:1 }} label="Note" value={cc.note} onChange={e=>setCc({...cc, note:e.target.value})} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={()=>setCcOpen(false)}>Cancel</Button>
                    <Button onClick={() => { s.closeCase(cc as any); setCcOpen(false); ok("Case closed"); }}>Run</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={2500} onClose={()=>setSnack({...snack, open:false})}>
                <Alert severity={snack.sev} onClose={()=>setSnack({...snack, open:false})}>{snack.msg}</Alert>
            </Snackbar>
        </Card>
    );
}
