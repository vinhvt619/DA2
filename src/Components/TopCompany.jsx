import React, { useState } from "react";
import { Button } from "flowbite-react";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import StarIcon from "@mui/icons-material/Star";
import Box from "@mui/material/Box";

export default function TopCompany() {
  const [active, setActive] = useState("t1");

  function ListCompany() {
    const [value, setValue] = useState(2.5);
    const [hover, setHover] = useState(-1);

    return (
      <div className="bg-white border-1 border-black rounded-2xl p-2.5 mt-4 w-120">
        <div className="flex items-center space-x-3">
          <div className="text-md pl-4">1st</div>
          <div className="w-10 h-10 rounded-full border-2 border-black bg-gray-300 ml-2.5 mr-4"></div>
          <div>
            <div className="text-xs">Công ty TNHH Sorimachi VN</div>
            <div className="flex text-xs items-center space-x-2">
              <div>Review</div>
              <Stack spacing={1} direction="row" alignItems="center">
                <Rating
                  size="small"
                  name="hover-feedback"
                  value={value}
                  precision={0.1}
                  onChange={(event, newValue) => {
                    setValue(newValue);
                  }}
                  onChangeActive={(event, newHover) => {
                    setHover(newHover);
                  }}
                  emptyIcon={
                    <StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />
                  }
                />
                {value !== null && (
                  <Box
                    sx={{ ml: 2 }}
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                  >
                    {hover !== -1 ? hover : value}
                    <StarIcon
                      className="ml-0.5"
                      style={{ color: "#e8b525" }}
                      sx={{ fontSize: "18px" }}
                    />
                  </Box>
                )}
              </Stack>
              <div>(2520 đánh giá)</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-100 w-[80%] bg-[#E8DEF5] border-2 border-gray-300 rounded-3xl p-5">
      <div className="font-medium text-lg">Top Công ty / Doanh nghiệp</div>
      <div className="flex mt-3">
        <Button
          color="light"
          size="xs"
          className={`pill mr-3 shadow-none  hover:bg-linear-to-r hover:from-[#F5D9FF] hover:to-[#F8E6FF] ${
            active === "t1"
              ? "bg-linear-to-r  from-[#E49AF6] to-[#CBA3FF]"
              : "bg-white"
          }`}
          onClick={() => setActive("t1")}
        >
          Theo lượt đánh giá
        </Button>
        <Button
          color="light"
          size="xs"
          className={`pill mr-3 hover:bg-linear-to-r hover:from-[#F5D9FF] hover:to-[#F8E6FF] ${
            active === "t2"
              ? "bg-linear-to-r  from-[#E49AF6] to-[#CBA3FF]"
              : "bg-white"
          }`}
          onClick={() => setActive("t2")}
        >
          Theo số lượng sử dụng
        </Button>
        <Button
          color="light"
          size="xs"
          className={`pill hover:bg-linear-to-r hover:from-[#F5D9FF] hover:to-[#F8E6FF] ${
            active === "t3"
              ? "bg-linear-to-r  from-[#E49AF6] to-[#CBA3FF]"
              : "bg-white"
          }`}
          onClick={() => setActive("t3")}
        >
          Theo thứ tự tăng dần
        </Button>
      </div>

      <ListCompany />
      <ListCompany />
      <ListCompany />
      <ListCompany />
      <ListCompany />
    </div>
  );
}
