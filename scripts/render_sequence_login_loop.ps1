param(
  [string]$OutFile = "C:\Users\Son\Documents\GitHub\DA2\bao-cao\uml\sequence-dang-nhap-loop-that-bai.png"
)

Add-Type -AssemblyName System.Drawing

$width = 2200
$height = 1450
$bmp = [System.Drawing.Bitmap]::new($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::White)

$black = [System.Drawing.Brushes]::Black
$white = [System.Drawing.Brushes]::White
$blackPen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 2.2)
$thinPen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 1.5)
$dashPen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 2)
$dashPen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$framePen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 1.8)
$framePen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$lifelinePen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 1.7)
$lifelinePen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$activationPen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 2)
$fontTitle = [System.Drawing.Font]::new("Arial", 30, [System.Drawing.FontStyle]::Bold)
$fontSubtitle = [System.Drawing.Font]::new("Arial", 16)
$fontParticipant = [System.Drawing.Font]::new("Arial", 16, [System.Drawing.FontStyle]::Bold)
$fontMessage = [System.Drawing.Font]::new("Arial", 15)
$fontFrame = [System.Drawing.Font]::new("Arial", 16, [System.Drawing.FontStyle]::Bold)

function Center-Text {
  param([string]$Text, [float]$X, [float]$Y, [System.Drawing.Font]$Font, [System.Drawing.Brush]$Brush = $black)
  $size = $g.MeasureString($Text, $Font)
  $g.DrawString($Text, $Font, $Brush, $X - ($size.Width / 2), $Y)
}

function Label-Text {
  param([string]$Text, [float]$X, [float]$Y, [System.Drawing.Font]$Font)
  $size = $g.MeasureString($Text, $Font)
  $padX = 8
  $padY = 3
  $rect = [System.Drawing.RectangleF]::new($X - ($size.Width / 2) - $padX, $Y - $padY, $size.Width + (2 * $padX), $size.Height + (2 * $padY))
  $g.FillRectangle($white, $rect)
  $g.DrawString($Text, $Font, $black, $rect.X + $padX, $rect.Y + $padY)
}

function Draw-Arrow {
  param([float]$X1, [float]$Y, [float]$X2, [bool]$Return = $false)
  $pen = if ($Return) { $dashPen } else { $blackPen }
  $g.DrawLine($pen, $X1, $Y, $X2, $Y)
  $direction = if ($X2 -gt $X1) { 1 } else { -1 }
  $head = 12
  $g.DrawLine($blackPen, $X2, $Y, $X2 - ($direction * $head), $Y - 7)
  $g.DrawLine($blackPen, $X2, $Y, $X2 - ($direction * $head), $Y + 7)
}

function Draw-Message {
  param([float]$X1, [float]$Y, [float]$X2, [string]$Text, [bool]$Return = $false)
  Draw-Arrow -X1 $X1 -Y $Y -X2 $X2 -Return $Return
  Label-Text -Text $Text -X (($X1 + $X2) / 2) -Y ($Y - 22) -Font $fontMessage
}

function Draw-Note {
  param([float]$X, [float]$Y, [float]$W, [string[]]$Lines)
  $h = 20 + ($Lines.Count * 20)
  $g.FillRectangle($white, $X, $Y, $W, $h)
  $g.DrawRectangle($thinPen, $X, $Y, $W, $h)
  for ($i = 0; $i -lt $Lines.Count; $i++) {
    Center-Text -Text $Lines[$i] -X ($X + ($W / 2)) -Y ($Y + 5 + ($i * 20)) -Font $fontMessage
  }
}

function Draw-Frame {
  param([float]$X, [float]$Y, [float]$W, [float]$H, [string]$Label, [bool]$Dashed = $false)
  $pen = if ($Dashed) { $framePen } else { $thinPen }
  $g.DrawRectangle($pen, $X, $Y, $W, $H)
  $size = $g.MeasureString($Label, $fontFrame)
  $g.FillRectangle($white, $X + 12, $Y - 2, $size.Width + 16, $size.Height + 5)
  $g.DrawString($Label, $fontFrame, $black, $X + 20, $Y + 1)
}

# Header
Center-Text -Text "Sequence Diagram — Đăng nhập thất bại và thử lại" -X 1100 -Y 25 -Font $fontTitle
Center-Text -Text "Khung loop biểu diễn việc nhập lại thông tin sau mỗi lần xác thực không thành công" -X 1100 -Y 62 -Font $fontSubtitle
$g.DrawLine($blackPen, 60, 95, 2140, 95)

# Participants and lifelines
$xs = @(190, 600, 1000, 1400, 1810)
$names = @("Người dùng", "React Auth UI", "AuthContext", "Express API", "MongoDB")
for ($i = 0; $i -lt $xs.Count; $i++) {
  $x = $xs[$i]
  $g.FillRectangle($white, $x - 125, 115, 250, 58)
  $g.DrawRectangle($blackPen, $x - 125, 115, 250, 58)
  Center-Text -Text $names[$i] -X $x -Y 134 -Font $fontParticipant
  $g.DrawLine($lifelinePen, $x, 173, $x, 1380)
}

# Loop frame: the retry cycle
Draw-Frame -X 65 -Y 205 -W 2070 -H 1110 -Label "loop [Người dùng chọn thử lại]" -Dashed $true

# Activation bars
foreach ($bar in @(@(591,270,18,980), @(991,325,18,925), @(1391,380,18,870))) {
  $g.FillRectangle($white, $bar[0], $bar[1], $bar[2], $bar[3])
  $g.DrawRectangle($activationPen, $bar[0], $bar[1], $bar[2], $bar[3])
}

# Request and lookup
Draw-Message 190 280 600 "Nhập lại thông tin đăng nhập"
Draw-Message 600 345 1000 "Gửi yêu cầu đăng nhập"
Draw-Message 1000 410 1400 "POST /api/login"
Draw-Message 1400 475 1810 "Tìm tài khoản theo username"
Draw-Message 1810 540 1400 "Trả về tài khoản hoặc không tìm thấy" $true
Draw-Note 1430 565 300 @("So sánh mật khẩu", "bằng bcrypt")

# Alternative branches inside loop
Draw-Frame -X 100 -Y 635 -W 2000 -H 570 -Label "alt [Kết quả xác thực]" -Dashed $false
$g.DrawLine($thinPen, 100, 910, 2100, 910)
Label-Text -Text "[Thông tin không hợp lệ]" -X 250 -Y 655 -Font $fontMessage
Label-Text -Text "[Thông tin hợp lệ]" -X 250 -Y 930 -Font $fontMessage

# Failure branch
Draw-Message 1400 715 1000 "HTTP 400 – Thông tin đăng nhập không chính xác" $true
Draw-Message 1000 780 600 "Hiển thị thông báo lỗi" $true
Draw-Message 600 845 190 "Yêu cầu người dùng nhập lại" $true

# Success branch
Draw-Message 1400 980 1000 "HTTP 200 – Đăng nhập thành công" $true
Draw-Message 1000 1045 600 "Cập nhật trạng thái đăng nhập" $true
Draw-Message 600 1110 190 "Chuyển đến trang chính" $true
Draw-Note 1550 1145 360 @("break [Đăng nhập thành công]", "Thoát khỏi vòng lặp")

Center-Text -Text "Khi thất bại, vòng lặp quay lại bước ‘Nhập lại thông tin đăng nhập’." -X 1100 -Y 1350 -Font $fontSubtitle
Center-Text -Text "Mũi tên liền: yêu cầu/thao tác  •  Mũi tên đứt: kết quả trả về" -X 1100 -Y 1400 -Font $fontSubtitle

$directory = Split-Path -Parent $OutFile
if (-not (Test-Path -LiteralPath $directory)) { New-Item -ItemType Directory -Path $directory -Force | Out-Null }
$bmp.Save($OutFile, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$blackPen.Dispose()
$thinPen.Dispose()
$dashPen.Dispose()
$framePen.Dispose()
$lifelinePen.Dispose()
$activationPen.Dispose()
Write-Output $OutFile
