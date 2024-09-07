import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinaryUploader.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { userName, email, password, fullName } = req.body;
  console.log(req.files);
  if (
    [fullName, userName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email and user name already exists");
  }

  console.log(req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImgLocalPath = req.files?.coverImg[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required ");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImg = await uploadOnCloudinary(coverImgLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  const user = await User.create({
    userName: userName.toLowerCase(),
    avatar: avatar.url,
    coverImg: coverImg?.url || "",
    email,
    password,
    fullName
  });

  const checkUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!checkUser) {
    throw new ApiError(
      500,
      "Something went wrong while registration the user "
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(200, checkUser, "User registred successfully"));
});

export { registerUser };
