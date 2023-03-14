import React from "react";
import SmartContractJob from "../components/smartContractJobMeshJs";
import { SelectChangeEvent } from "@mui/material/Select";
import { useGetList } from "react-admin";
import dayjs, { Dayjs } from "dayjs";
import Box from "@mui/material/Box";
import { CardanoWallet, useWallet } from "@meshsdk/react";
import { script, scriptAddr } from "./contract";
import moment from "moment";
import Typography from "@mui/material/Typography";
import {
  Transaction,
  Data,
  BlockfrostProvider,
  resolveDataHash,
  KoiosProvider,
} from "@meshsdk/core";

const SmartContracts = () => {
  const { wallet, connected, connecting } = useWallet();

  const initContract = {
    selected: "",
    contracts: [],
  };
  const [contract, setContract] = React.useState(initContract);
  const [unlockPartner, setUnlockPartner] = React.useState("");

  const [notification, setNotification] = React.useState({
    error: false,
    message: "",
  });

  const contracts = useGetList("contracts", {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "createdDate", order: "DESC" },
  });

  const initJobBids = {
    selected: "0",
    jobBids: [],
  };
  const [jobBids, setJobBids] = React.useState(initJobBids);

  //{ data, total, isLoading, error } =  useGetList("jobbids",{})
  const jobBidsList = useGetList("jobbids", {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "createdDate", order: "DESC" },
    filter: { queryType: "employer" },
  });

  React.useEffect(() => {
    if (
      !jobBidsList.isLoading &&
      !jobBidsList.error &&
      jobBidsList.data.length > 0
    ) {
      const selected = jobBidsList.data[0].id;
      setJobBids({ selected, jobBids: jobBidsList.data });
    }
  }, [jobBidsList.data]);

  //admin pkh
  const [adminPKH, setAdminPKH] = React.useState("");
  const adminWallets = useGetList("adminwallets", {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "createdDate", order: "DESC" },
  });

  React.useEffect(() => {
    if (
      !adminWallets.isLoading &&
      !adminWallets.error &&
      adminWallets.data.length > 0
    ) {
      const pKeyHash = adminWallets.data[0].pKeyHash;
      setAdminPKH(pKeyHash);
      setDatum({ ...datum, publicKeyHash: pKeyHash });
    }
  }, [adminWallets.data]);

  //user pkh
  const [userPKH, setUserPKH] = React.useState("");

  const userWallets = useGetList("wallets", {
    pagination: { page: 1, perPage: 10 },
    filter: { userId: localStorage.getItem("username") },
  });

  React.useEffect(() => {
    if (
      !userWallets.isLoading &&
      !userWallets.error &&
      userWallets.data.length > 0
    ) {
      const pKeyHash = userWallets.data[0].pKeyHash;
      setUserPKH(pKeyHash);
    }
  }, [userWallets.data]);

  React.useEffect(() => {
    const jobBidValue =
      jobBids.jobBids.find((item) => item.id === jobBids.selected)?.bidValue ||
      0;
    setAmountToLock(jobBidValue);
  }, [jobBids]);

  React.useEffect(() => {
    if (!contracts.isLoading && !contracts.error) {
      const selected = contracts.data[0].id;
      setContract({ selected, contracts: contracts.data });
    }
  }, [contracts.data]);

  const [amountToLock, setAmountToLock] = React.useState(0);

  const [redeemAdaValues, setRedeemAdaValues] = React.useState({
    amountToRedeem: "",
    datumToRedeem: "",
    transactionIdLocked: "",
    transactionIndxLocked: "",
    manualFee: "900000",
  });

  const redeemAdaFromPlutus = async () => {};

  const handleContractChange = (event: SelectChangeEvent) => {
    setContract({ ...contract, selected: event.target.value });
  };

  const handleJobBidChange = (event: SelectChangeEvent) => {
    setJobBids({ ...jobBids, selected: event.target.value });
  };

  const handleChangeUnlockPartner = (event: SelectChangeEvent) => {
    setUnlockPartner(event.target.value);
    const publicKeyHash =
      event.target.value === "bworks"
        ? adminPKH
        : event.target.value === "employer"
        ? userPKH
        : "";
    setDatum({ ...datum, publicKeyHash: publicKeyHash });
  };

  //lock datum
  const currentDate = dayjs();
  const [datum, setDatum] = React.useState({
    publicKeyHash: "",
    deadline: currentDate,
  });

  const handleChangeLockAda = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmountToLock(parseInt(event.target.value));
  };

  const handleChangePublicKeyHash = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDatum({ ...datum, publicKeyHash: event.target.value });
  };

  const handleChangeDate = (newValue: any | null) => {
    //validate datum: deadline must be minimum 1 week
    if (newValue.diff(currentDate, "day") < 7) {
      setNotification({ error: true, message: "Minimum deadline is 01 week" });
      return;
    } else {
      setNotification({ error: false, message: "" });
    }
    setDatum({ ...datum, deadline: newValue });
  };

  //redeem data
  const handleChangRedeemAda =
    (prop) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setRedeemAdaValues({ ...redeemAdaValues, [prop]: event.target.value });
    };

  const sendAdaToPlutus = async () => {
    //public keyhash must be a valid bworks wallet address if unlock transaction signed by bworks.
    const scriptAddr = contract.contracts.find(
      (item) => item.id === contract.selected
    ).address;
    const d: Data = {
      alternative: 0,
      fields: [datum.publicKeyHash, datum.deadline.unix()],
    };
    const amountToLockLoveLace = (amountToLock * 1000000).toString();
    if (wallet) {
      const tx = new Transaction({ initiator: wallet });

      tx.sendLovelace(
        {
          address: scriptAddr,
          datum: {
            value: d,
          },
        },
        amountToLockLoveLace
      );
      const unsignedTx = await tx.build();
      const signedTx = await wallet.signTx(unsignedTx);
      const txHash = await wallet.submitTx(signedTx);

      console.log("txHash", txHash);
    }
  };
  return (
    <Box sx={{ m: 3, display: "flex", flex: 1, flexDirection: "column" }}>
      <Box sx={{ m: 3, display: "flex", flex: 1, flexDirection: "row" }}>
        <SmartContractJob
          handleContractChange={handleContractChange}
          handleJobBidChange={handleJobBidChange}
          contract={contract}
          jobBids={jobBids}
          sendAdaToPlutus={sendAdaToPlutus}
          redeemAdaFromPlutus={redeemAdaFromPlutus}
          handleChangeLockAda={handleChangeLockAda}
          handleChangRedeemAda={handleChangRedeemAda}
          handleChangeUnlockPartner={handleChangeUnlockPartner}
          handleChangePublicKeyHash={handleChangePublicKeyHash}
          amountToLock={amountToLock}
          datum={datum}
          unlockPartner={unlockPartner}
          handleChangeDate={handleChangeDate}
          redeemAdaValues={redeemAdaValues}
          notification={notification}
        ></SmartContractJob>
        <CardanoWallet />
      </Box>
    </Box>
  );
};

export default SmartContracts;